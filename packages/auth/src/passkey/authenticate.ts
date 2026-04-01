/**
 * Passkey authentication (credential assertion)
 *
 * Based on oslo webauthn documentation:
 * https://webauthn.oslojs.dev/examples/authentication
 */

import {
	verifyECDSASignature,
	p256,
	decodeSEC1PublicKey,
	decodePKIXECDSASignature,
} from "@oslojs/crypto/ecdsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64urlNoPadding, decodeBase64urlIgnorePadding } from "@oslojs/encoding";
import {
	parseAuthenticatorData,
	parseClientDataJSON,
	ClientDataType,
	createAssertionSignatureMessage,
} from "@oslojs/webauthn";

import { generateToken } from "../tokens.js";
import type { Credential, AuthAdapter, User } from "../types.js";
import type {
	AuthenticationOptions,
	AuthenticationResponse,
	VerifiedAuthentication,
	ChallengeStore,
	PasskeyConfig,
} from "./types.js";

const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate authentication options for signing in with a passkey
 */
export async function generateAuthenticationOptions(
	config: PasskeyConfig,
	credentials: Credential[],
	challengeStore: ChallengeStore,
): Promise<AuthenticationOptions> {
	const challenge = generateToken();

	// Store challenge for verification
	await challengeStore.set(challenge, {
		type: "authentication",
		expiresAt: Date.now() + CHALLENGE_TTL,
	});

	return {
		challenge,
		rpId: config.rpId,
		timeout: 60000,
		userVerification: "preferred",
		allowCredentials:
			credentials.length > 0
				? credentials.map((cred) => ({
						type: "public-key" as const,
						id: cred.id,
						transports: cred.transports,
					}))
				: undefined, // Empty = allow any discoverable credential
	};
}

/**
 * Verify an authentication response
 */
export async function verifyAuthenticationResponse(
	config: PasskeyConfig,
	response: AuthenticationResponse,
	credential: Credential,
	challengeStore: ChallengeStore,
): Promise<VerifiedAuthentication> {
	// Decode the response
	const clientDataJSON = decodeBase64urlIgnorePadding(response.response.clientDataJSON);
	const authenticatorData = decodeBase64urlIgnorePadding(response.response.authenticatorData);
	const signature = decodeBase64urlIgnorePadding(response.response.signature);

	// Parse client data
	const clientData = parseClientDataJSON(clientDataJSON);

	// Verify client data type
	if (clientData.type !== ClientDataType.Get) {
		throw new Error("Invalid client data type");
	}

	// Verify challenge - convert Uint8Array back to base64url string (no padding, matching stored format)
	const challengeString = encodeBase64urlNoPadding(clientData.challenge);
	const challengeData = await challengeStore.get(challengeString);
	if (!challengeData) {
		throw new Error("Challenge not found or expired");
	}
	if (challengeData.type !== "authentication") {
		throw new Error("Invalid challenge type");
	}
	if (challengeData.expiresAt < Date.now()) {
		await challengeStore.delete(challengeString);
		throw new Error("Challenge expired");
	}

	// Delete challenge (single-use)
	await challengeStore.delete(challengeString);

	// Verify origin
	if (clientData.origin !== config.origin) {
		throw new Error(`Invalid origin: expected ${config.origin}, got ${clientData.origin}`);
	}

	// Parse authenticator data
	const authData = parseAuthenticatorData(authenticatorData);

	// Verify RP ID hash
	if (!authData.verifyRelyingPartyIdHash(config.rpId)) {
		throw new Error("Invalid RP ID hash");
	}

	// Verify flags
	if (!authData.userPresent) {
		throw new Error("User presence not verified");
	}

	// Verify counter (prevent replay attacks)
	if (authData.signatureCounter !== 0 && authData.signatureCounter <= credential.counter) {
		throw new Error("Invalid signature counter - possible cloned authenticator");
	}

	// Create the message that was signed
	const signatureMessage = createAssertionSignatureMessage(authenticatorData, clientDataJSON);

	// Ensure public key is a Uint8Array (may come as Buffer from some DB drivers)
	const publicKeyBytes =
		credential.publicKey instanceof Uint8Array
			? credential.publicKey
			: new Uint8Array(credential.publicKey);

	// Decode the stored SEC1-encoded public key and verify signature
	// The signature from WebAuthn is DER-encoded (PKIX format)
	const ecdsaPublicKey = decodeSEC1PublicKey(p256, publicKeyBytes);
	const ecdsaSignature = decodePKIXECDSASignature(signature);
	const hash = sha256(signatureMessage);
	const signatureValid = verifyECDSASignature(ecdsaPublicKey, hash, ecdsaSignature);

	if (!signatureValid) {
		throw new Error("Invalid signature");
	}

	return {
		credentialId: response.id,
		newCounter: authData.signatureCounter,
	};
}

/**
 * Authenticate a user with a passkey
 */
export async function authenticateWithPasskey(
	config: PasskeyConfig,
	adapter: AuthAdapter,
	response: AuthenticationResponse,
	challengeStore: ChallengeStore,
): Promise<User> {
	// Find the credential
	const credential = await adapter.getCredentialById(response.id);
	if (!credential) {
		throw new Error("Credential not found");
	}

	// Verify the response
	const verified = await verifyAuthenticationResponse(config, response, credential, challengeStore);

	// Update counter
	await adapter.updateCredentialCounter(verified.credentialId, verified.newCounter);

	// Get the user
	const user = await adapter.getUserById(credential.userId);
	if (!user) {
		throw new Error("User not found");
	}

	return user;
}
