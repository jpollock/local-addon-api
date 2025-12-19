# Release Process

This document describes how to release new versions of `@local-labs/local-addon-api`.

## Prerequisites

- Push access to the repository
- Permission to create GitHub releases

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking API changes
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.0.1): Bug fixes, backwards compatible

## Release Steps

### 1. Prepare the Release

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Run tests
npm test

# Run security tests
npm run test:security

# Build and verify
npm run build
npm pack --dry-run
```

### 2. Update Version

```bash
# For patch release (bug fixes)
npm version patch

# For minor release (new features)
npm version minor

# For major release (breaking changes)
npm version major
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag

### 3. Push Changes

```bash
git push origin main --tags
```

### 4. Create GitHub Release

1. Go to [GitHub Releases](https://github.com/jpollock/local-addon-api/releases)
2. Click "Draft a new release"
3. Select the version tag (e.g., `v0.1.0`)
4. Set release title: `v0.1.0`
5. Add release notes (see template below)
6. Click "Publish release"

### 5. Automated Publishing

Once the GitHub release is published, the `publish.yml` workflow automatically:
- Runs tests
- Builds the package
- Publishes to npm with provenance

## Release Notes Template

```markdown
## What's Changed

### Features
- Feature description (#PR)

### Bug Fixes
- Fix description (#PR)

### Security
- Security improvement (#PR)

### Documentation
- Doc update (#PR)

## Upgrading

### From v0.0.x to v0.1.0
- No breaking changes
- (or list migration steps)

## Full Changelog
https://github.com/jpollock/local-addon-api/compare/v0.0.1...v0.1.0
```

## Verifying the Release

After publishing:

```bash
# Check npm registry
npm view @local-labs/local-addon-api

# Test installation
npm install @local-labs/local-addon-api@latest
```

## Troubleshooting

### Publish Failed

If the GitHub Actions publish fails:

1. Check the [Actions tab](https://github.com/jpollock/local-addon-api/actions) for error details
2. Fix the issue
3. Delete the release and tag if needed:
   ```bash
   git tag -d v0.0.1
   git push origin :refs/tags/v0.0.1
   ```
4. Retry the release process

### npm Access Issues

The publish workflow uses GitHub's OIDC for npm provenance. Ensure:
- The repository has `id-token: write` permission
- npm is configured for the `@local-labs` scope

## Pre-release Versions

For testing releases before stable:

```bash
# Create a pre-release version
npm version prerelease --preid=beta
# Creates: 0.0.2-beta.0

# Publish with beta tag
npm publish --tag beta
```

Users can install with:
```bash
npm install @local-labs/local-addon-api@beta
```
