# Security Policy

## Supported Versions

The latest release on the `main` branch is the only supported version.
Security patches are applied to `main` and released as new versions.

## Reporting a Vulnerability

Report security vulnerabilities privately via GitHub Security Advisories:

1. Go to the [Security tab](https://github.com/ahliweb/awcms-micro-sman2pangkalanbun/security)
2. Click **Report a vulnerability**
3. Describe the issue with steps to reproduce

You should receive an initial response within **48 hours** and a status update within **5 business days**.

Please do not file public issues for security vulnerabilities.

## Scope

This policy covers the SMAN 2 Pangkalan Bun school website, its CMS configuration, Cloudflare Workers deployment, and all associated infrastructure code.

### In scope

- Authentication and authorization bypasses
- Data exposure or leaks
- Server-side request forgery (SSRF)
- Injection vulnerabilities (SQL, XSS, etc.)
- Insecure direct object references

### Out of scope

- Issues in third-party dependencies (report to upstream instead)
- Theoretical vulnerabilities without a working proof of concept
- Social engineering or phishing attacks
