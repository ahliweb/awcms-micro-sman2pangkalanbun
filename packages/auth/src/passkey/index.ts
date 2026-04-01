/**
 * Passkey authentication module
 */

export type {
	RegistrationOptions,
	RegistrationResponse,
	VerifiedRegistration,
	AuthenticationOptions,
	AuthenticationResponse,
	VerifiedAuthentication,
	ChallengeStore,
	ChallengeData,
	PasskeyConfig,
} from "./types.js";

export {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	registerPasskey,
} from "./register.js";

export {
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
	authenticateWithPasskey,
} from "./authenticate.js";
