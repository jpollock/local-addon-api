# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to the maintainers privately
3. Include a detailed description and reproduction steps
4. Allow reasonable time for a fix before public disclosure

We aim to respond within 48 hours and provide a fix within 7 days for critical issues.

---

## Security Model

This library is designed with defense-in-depth principles for addon development in Local by Flywheel. All user input is treated as untrusted.

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Command Injection | Executable whitelist + dangerous character blocking |
| Path Traversal | Base path validation + symlink resolution |
| Zip Slip | Entry path validation during extraction |
| WP-CLI Injection | Command/subcommand whitelisting |
| MITM Attacks | HTTPS-only downloads enforced |
| Redirect Loops | Maximum redirect limit (5) |
| Null Byte Injection | Explicit null byte checks |

---

## Security Controls

### 1. Command Validation (`src/utils/validation.ts`)

All shell commands are validated before execution.

**Allowed Executables:**
- `npm`, `yarn`, `pnpm`, `bun` (with subcommand restrictions)
- `node` (with relative path enforcement)

**Blocked Characters:**
```
; & | ` $ ( ) < > \ " '
```

**Example:**
```typescript
import { validateCommand } from '@local-labs/local-addon-api';

const result = validateCommand(userInput);
if (!result.valid) {
  throw new Error(result.error);
}
// result.sanitizedCommand is safe to execute
```

**Subcommand Restrictions:**
| Executable | Allowed Subcommands |
|------------|---------------------|
| npm/yarn/pnpm/bun | start, run, install, build, test, dev, ci |
| node | Any relative .js file (no absolute paths, no `..`) |

### 2. Path Validation (`src/utils/validation.ts`)

Prevents directory traversal attacks.

**Protections:**
- Resolves `..` and `.` before validation
- Enforces paths stay within base directory
- Detects symlinks that escape boundaries
- Blocks null bytes in paths

**Example:**
```typescript
import { validatePath, validateAppPath } from '@local-labs/local-addon-api';

// Validate arbitrary path
const pathResult = validatePath('/base/dir', userPath, 'plugin path');

// Validate app directory
const appResult = validateAppPath('/apps', appId);
```

**App ID Validation:**
- Alphanumeric, hyphens, underscores only
- No path separators (`/` or `\`)
- No absolute path indicators

### 3. WP-CLI Security (`src/wordpress/WpCliManager.ts`)

WP-CLI commands are whitelisted to prevent arbitrary command execution.

**Allowed Commands:**
```
plugin, option, user, post, db, cache, rewrite, theme
```

**Allowed Plugin Subcommands:**
```
list, status, activate, deactivate, delete, get, install,
is-installed, path, search, toggle, uninstall, update
```

**Argument Validation:**
- Shell metacharacters blocked: `; & | \` $ ( ) < > \ ' " \0`
- Plugin slugs validated: alphanumeric, hyphens, underscores only

**Example:**
```typescript
const wpCli = new WpCliManager(services.wpCli);

// Safe - command is whitelisted
await wpCli.execute(site, 'plugin', ['list', '--format=json']);

// Blocked - command not whitelisted
await wpCli.execute(site, 'eval', ['malicious code']);
// Returns: { success: false, error: "Command 'eval' is not allowed" }
```

### 4. Zip Slip Prevention (`src/wordpress/ZipPluginInstaller.ts`)

Prevents malicious zip files from writing outside the extraction directory.

**Protections:**
- Each zip entry path is validated before extraction
- Paths containing `..` that escape the target directory are rejected
- Extraction aborts immediately on detecting malicious entries

**Example:**
```typescript
// Malicious zip with entry "../../../etc/passwd" is blocked
// Error: "Zip entry path escapes extraction directory"
```

### 5. Download Security (`src/wordpress/ZipPluginInstaller.ts`)

**HTTPS Enforcement:**
- HTTP downloads are blocked entirely
- Only HTTPS URLs are allowed for remote downloads

**Redirect Protection:**
- Maximum 5 redirects followed
- Prevents DoS via redirect loops
- Prevents open redirect attacks

**Example:**
```typescript
// Blocked - insecure
await installer.installFromZip('http://example.com/plugin.zip', target);
// Error: "HTTP downloads are not allowed for security reasons"

// Allowed - secure
await installer.installFromZip('https://example.com/plugin.zip', target);
```

### 6. Git URL Validation (`src/utils/validation.ts`)

Git repository URLs are validated to prevent injection.

**Allowed Protocols:**
- `https://` - Standard HTTPS
- `git@host:path` - SSH format
- `ssh://` - SSH protocol

**Example:**
```typescript
import { isValidGitUrl, isValidBranchName } from '@local-labs/local-addon-api';

if (!isValidGitUrl(repoUrl)) {
  throw new Error('Invalid Git URL');
}

if (!isValidBranchName(branch)) {
  throw new Error('Invalid branch name');
}
```

**Branch Name Validation:**
- Blocks control characters
- Blocks shell metacharacters (`~ ^ : ? * [`)
- Blocks `..`, `@{`, `\`
- Max 255 characters

### 7. Plugin Slug Validation (`src/utils/validation.ts`)

WordPress plugin slugs are validated consistently across all operations.

**Rules:**
- Alphanumeric, hyphens, underscores only
- Case-insensitive
- Max 200 characters

**Example:**
```typescript
import { isValidPluginSlug } from '@local-labs/local-addon-api';

if (!isValidPluginSlug(pluginSlug)) {
  throw new Error('Invalid plugin slug');
}
```

---

## Security Testing

Security-critical code has enforced coverage thresholds:

| File | Required Coverage |
|------|-------------------|
| `src/utils/validation.ts` | 80% (all metrics) |
| `src/wordpress/WpCliManager.ts` | 80% (all metrics) |
| `src/node/GitManager.ts` | 70% (branches) |

Run security tests:
```bash
npm run test:security
```

---

## Automated Security Scanning

- **CodeQL**: Runs on every PR and weekly via GitHub Actions
- **Dependabot**: Monitors dependencies for known vulnerabilities
- **npm audit**: Run `npm audit` before releases

---

## Best Practices for Addon Developers

1. **Always validate user input** before passing to this library
2. **Use the Result pattern** - check `.success` before using data
3. **Don't bypass validation** - use the provided functions
4. **Keep dependencies updated** - security patches are released regularly
5. **Review IPC handlers** - validate all data from renderer process

```typescript
// Good - validates input
createIpcHandler('my-addon:install', async (request) => {
  if (!isValidPluginSlug(request.slug)) {
    return err('Invalid plugin slug');
  }
  // ... proceed with validated input
});

// Bad - trusts input blindly
createIpcHandler('my-addon:install', async (request) => {
  // NEVER do this - request.slug could be malicious
  await wpCli.execute(site, 'plugin', ['install', request.slug]);
});
```

---

## Changelog

### 0.0.1
- Initial security model implementation
- Command injection prevention
- Path traversal prevention
- Zip Slip protection
- WP-CLI command whitelisting
- HTTPS-only downloads
- Git URL validation
