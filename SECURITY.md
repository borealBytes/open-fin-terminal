# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

### How to Report

1. **Do NOT open a public issue**
2. **Email** security contact via GitHub (use "Security" tab > "Report a vulnerability")
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment** within 48 hours
- **Initial assessment** within 7 days
- **Fix timeline** provided based on severity
- **Credit** in release notes (if desired)

### Security Best Practices

This project implements:

#### Credential Security
- **Never log secrets** in plaintext
- **Redact credentials** in memory and logs
- **Secure storage**: Browser secure storage or encrypted vault (self-hosted)
- **No hardcoded keys** in source code
- **Environment variables** for sensitive config

#### Application Security
- **Strict CSP** (Content Security Policy)
- **No eval()** or unsafe dynamic code execution
- **DOMPurify** for any HTML content (RSS)
- **SRI** (Subresource Integrity) for external resources (if any)
- **Dependency scanning** (npm audit, OSV scanner)
- **Regular updates** of dependencies

#### API Security
- **Rate limiting** on all external requests
- **Exponential backoff** with jitter
- **Timeout handling**
- **Error sanitization** (no sensitive data in error messages)
- **CORS** properly configured

#### Data Privacy
- **No tracking** of users
- **No external analytics** by default
- **Local storage** only (IndexedDB, Service Worker cache)
- **No PII collection**
- **Opt-in** for any telemetry (if added)

### Disclosure Policy

After a fix is released:
1. **Coordinated disclosure** with reporter
2. **CVE requested** for significant vulnerabilities
3. **Security advisory** published on GitHub
4. **Release notes** include security fixes
5. **Credit** given to reporter (if desired)

### Security Contacts

For urgent security issues:
- Use GitHub Security tab
- Direct message to maintainers (only for severe issues)

## Known Security Considerations

### Data Source Security
- All data sources are external and untrusted
- Responses are validated with zod schemas
- Malformed data is sanitized or rejected
- No execution of code from external sources

### Plugin Security
- Plugins run in sandboxed Web Workers
- No network access from workers
- Limited CPU/memory quotas
- Permission manifest system

### Authentication (Optional Adapters)
- OAuth tokens stored in secure browser storage
- Tokens encrypted at rest (self-hosted server)
- No tokens in URL params or logs
- Token rotation supported

Thank you for helping keep Open Financial Terminal secure!
