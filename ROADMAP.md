# Roadmap

This document outlines the development roadmap for `@local-labs/local-addon-api`.

## Current Status

**Version**: 0.0.1 (pre-release)

The core API is feature-complete with:
- 7 modules (core, site, wordpress, node, utils, types, schemas)
- 79.66% test coverage (471 tests)
- Security validation framework
- TypeDoc API documentation
- CI/CD workflows

---

## Phase 1: Stable Release (v0.1.0)

**Goal**: Production-ready stable release with complete documentation, security review, and npm publishing.

### GitHub & Repository
- [ ] Verify GitHub repository settings (branch protection, required reviews)
- [ ] Add CONTRIBUTING.md with development guidelines
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Add issue and PR templates
- [ ] Configure Dependabot for security updates

### CI/CD & GitHub Actions
- [ ] Verify test workflow runs on all PRs
- [ ] Verify publish workflow with npm provenance
- [ ] Add CodeQL security scanning
- [ ] Add automated release notes generation
- [ ] Configure branch protection rules

### Documentation
- [ ] Complete example addon implementation (main.ts, renderer.tsx)
- [ ] Add inline code examples in TypeDoc comments
- [ ] Publish API docs to GitHub Pages
- [ ] Add migration guide from raw Local API

### Security Review
- [ ] Audit all input validation functions
- [ ] Review command execution paths
- [ ] Verify Zip Slip protection coverage
- [ ] Check for hardcoded secrets/credentials
- [ ] Document security model in SECURITY.md

### Test Coverage
- [ ] Increase `constants.ts` coverage (currently 0%)
- [ ] Increase `logger.ts` coverage (currently 27%)
- [ ] Increase `timeouts.ts` coverage (currently 0%)
- [ ] Add integration tests with Local environment mocks
- [ ] Achieve 85% overall coverage target

### npm Publishing
- [ ] Verify package.json metadata (repository, homepage, bugs)
- [ ] Test npm pack output
- [ ] Verify exports and types resolve correctly
- [ ] Document release process
- [ ] Create initial npm release

---

## Phase 2: Enhanced Features (v0.2.0)

**Goal**: Expand functionality based on real-world addon development needs.

### WordPress Enhancements
- [ ] WordPress theme management API
- [ ] WP-CLI async streaming for long-running commands
- [ ] Plugin update detection and management
- [ ] WordPress multisite support

### Node.js Orchestration
- [ ] Multi-process app management
- [ ] Health check utilities
- [ ] Process restart strategies
- [ ] Log aggregation

### Configuration
- [ ] Environment variable injection
- [ ] Secrets management integration
- [ ] Configuration inheritance/overrides

---

## Phase 3: Developer Experience (v0.3.0)

**Goal**: Make addon development fast and intuitive.

### Tooling
- [ ] CLI scaffolding tool (`npx create-local-addon`)
- [ ] VSCode extension with snippets
- [ ] Development server with hot reload
- [ ] Debug utilities

### Documentation
- [ ] Interactive API explorer
- [ ] Video tutorials
- [ ] Community examples gallery
- [ ] Cookbook for common patterns

---

## Phase 4: Advanced Capabilities (v1.0.0)

**Goal**: Enterprise-ready features for complex addon scenarios.

### Data Management
- [ ] Database backup/restore utilities
- [ ] Data migration helpers
- [ ] Import/export functionality

### Remote Operations
- [ ] Remote site sync capabilities
- [ ] Cloud deployment integration
- [ ] Multi-environment support

### Extensibility
- [ ] Plugin system for custom sources
- [ ] Hook system for third-party integrations
- [ ] API versioning strategy

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to propose features or report issues.

## Version History

- **0.0.1** - Initial pre-release with core API
