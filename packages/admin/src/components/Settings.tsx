import {
	Gear,
	ShareNetwork,
	MagnifyingGlass,
	Shield,
	Globe,
	Key,
	Envelope,
	CaretRight,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { fetchManifest } from "../lib/api";

interface SettingsLinkProps {
	to: string;
	icon: React.ReactNode;
	title: string;
	description: string;
}

function SettingsLink({ to, icon, title, description }: SettingsLinkProps) {
	return (
		<Link
			to={to}
			className="flex items-center justify-between p-4 rounded-lg border bg-kumo-base hover:bg-kumo-tint transition-colors"
		>
			<div className="flex items-center gap-3">
				<div className="text-kumo-subtle">{icon}</div>
				<div>
					<div className="font-medium">{title}</div>
					<div className="text-sm text-kumo-subtle">{description}</div>
				</div>
			</div>
			<CaretRight className="h-5 w-5 text-kumo-subtle" />
		</Link>
	);
}

/**
 * Settings hub page — links to all settings sub-pages.
 */
export function Settings() {
	const { data: manifest } = useQuery({
		queryKey: ["manifest"],
		queryFn: fetchManifest,
	});

	const showSecuritySettings = manifest?.authMode === "passkey";

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Settings</h1>

			{/* Site settings */}
			<div className="space-y-2">
				<SettingsLink
					to="/settings/general"
					icon={<Gear className="h-5 w-5" />}
					title="General"
					description="Site identity, logo, favicon, and reading preferences"
				/>
				<SettingsLink
					to="/settings/social"
					icon={<ShareNetwork className="h-5 w-5" />}
					title="Social Links"
					description="Social media profile links"
				/>
				<SettingsLink
					to="/settings/seo"
					icon={<MagnifyingGlass className="h-5 w-5" />}
					title="SEO"
					description="Search engine optimization and verification"
				/>
			</div>

			{/* Security & access — only for passkey auth */}
			{showSecuritySettings && (
				<div className="space-y-2">
					<SettingsLink
						to="/settings/security"
						icon={<Shield className="h-5 w-5" />}
						title="Security"
						description="Manage your passkeys and authentication"
					/>
					<SettingsLink
						to="/settings/allowed-domains"
						icon={<Globe className="h-5 w-5" />}
						title="Self-Signup Domains"
						description="Allow users from specific domains to sign up"
					/>
				</div>
			)}

			{/* Always visible for admins */}
			<div className="space-y-2">
				<SettingsLink
					to="/settings/api-tokens"
					icon={<Key className="h-5 w-5" />}
					title="API Tokens"
					description="Create personal access tokens for programmatic API access"
				/>
				<SettingsLink
					to="/settings/email"
					icon={<Envelope className="h-5 w-5" />}
					title="Email"
					description="View email provider status and send test emails"
				/>
			</div>
		</div>
	);
}

export default Settings;
