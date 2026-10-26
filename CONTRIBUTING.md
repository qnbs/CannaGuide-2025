# Contributing to CannaGuide 2025

Thank you for considering contributing to CannaGuide 2025! We welcome contributions from the community — whether it's fixing bugs, adding features, improving translations, or enhancing documentation.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Convention](#commit-convention)
- [Code Style](#code-style)
- [Testing](#testing)
- [Internationalization (i18n)](#internationalization-i18n)
- [Graphify knowledge graph & MCP](#graphify-knowledge-graph--mcp)
- [Pull Request Process](#pull-request-process)
- [Strain Encyclopedia Contributions](#strain-encyclopedia-contributions)
- [Deprecation Strategy](#deprecation-strategy)
- [Reporting Issues](#reporting-issues)
- [Release Housekeeping](#release-housekeeping)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Please report unacceptable behavior by opening an issue.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
    ```bash
    git clone https://github.com/<your-username>/CannaGuide-2025.git
    cd CannaGuide-2025
    ```
3. **Install dependencies**:
    ```bash
    corepack pnpm install --frozen-lockfile
    ```
4. **Start the development server**:
    ```bash
    corepack pnpm --filter @cannaguide/web dev
    ```

---

## Development Setup

### Prerequisites

- **Node.js** >=24.15.0 <25; use an existing repository-specific version manager and verify `node --version` before package commands.
- **pnpm** exactly as pinned in root `package.json` (`packageManager`), invoked through Corepack. See [AGENTS.md](AGENTS.md#nodejs-version-required) for the cloud-host PATH setup; a native host may already have a compatible Node through another version manager.
- On the low-memory maintainer host, run one task at a time and follow [the binding verification rules](AGENTS.md#local-verification-on-low-end-hardware-binding). The web server uses `/CannaGuide-2025/` on port 5173.

### Tech Stack

| Category | Technology                          |
| :------- | :---------------------------------- |
| Frontend | React 19 + TypeScript               |
| State    | Redux Toolkit + RTK Query           |
| AI       | Google Gemini API (`@google/genai`) |
| Build    | Vite 8 + vite-plugin-pwa            |
| Styling  | Tailwind CSS                        |
| Testing  | Vitest + Playwright                 |
| i18n     | i18next + react-i18next             |

### Environment

No environment variables are required for local development. AI features require a Gemini API key configured in **Settings → General & UI → AI Security** within the running app.

---

## Branch Strategy

- **`main`** — Production-ready code. All PRs target this branch.
- **`feature/<name>`** — New features (e.g., `feature/nutrient-scheduler`).
- **`fix/<name>`** — Bug fixes (e.g., `fix/vpd-gauge-overflow`).
- **`docs/<name>`** — Documentation changes.
- **`refactor/<name>`** — Code refactoring without behavior changes.

```bash
git checkout -b feature/my-new-feature
```

### Push Workflow (Maintainers)

Direct pushes to `main` are blocked (`enforce_admins: true`). All changes go through Pull Requests:

```bash
# 1. Create a named branch from freshly verified origin/main
git switch -c feature/my-feature origin/main

# 2. Stage only the intended files, then commit with the approved signing identity
git add path/to/changed-file
git commit -S -m "feat(scope): description"

# 3. Push with hooks enabled and open a Ready for Review PR
git push -u origin feature/my-feature
gh pr create --repo qnbs/CannaGuide-2025 --base main --head feature/my-feature
```

Do not merge until the required **✅ CI Status** check passes on the current head and review
findings are addressed. It aggregates build, unit/coverage, verify, security and Chromium E2E
(plus Rust when desktop files changed). Keep commits signed and hooks enabled. Recheck the
resulting main and production separately; a green PR is not production evidence.

---

## Graphify knowledge graph & MCP

The repository ships a Graphify knowledge graph under `graphify-out/` and configures the Graphify + GitKraken MCP servers in `.mcp.json` (Claude Code reads it at the repo root; approve via `/mcp`).

- MCP servers (`.mcp.json`): Graphify via `node scripts/graphify-mcp-launcher.mjs` (requires **`uv`**), GitKraken via `node scripts/gitkraken-mcp-launcher.mjs` (requires **`gk auth login`**). Diagnose: **`pnpm run mcp:doctor`** / **`pnpm run graphify:mcp:doctor`**.
- Codespaces / Dev Container: `.devcontainer/Dockerfile` installs **`uv`** into the image (`/usr/local/bin/uv`) so Graphify-MCP works without extra setup.
- Refresh the graph with `graphify update .` (AST-only, no API cost).

**Maintainers:** deliver changes through a branch and pull request. A failed PR-creation call
does not authorize a direct push to main or a ruleset bypass.

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types

| Type       | Description                                             |
| :--------- | :------------------------------------------------------ |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `perf`     | Performance improvement                                 |
| `chore`    | Build process, tooling, or dependency updates           |
| `a11y`     | Accessibility improvements                              |
| `i18n`     | Internationalization changes                            |

### Scopes

Common scopes: `ai`, `plants`, `strains`, `equipment`, `knowledge`, `settings`, `help`, `genealogy`, `pwa`, `ci`, `security`, `ui`.

### Examples

```
feat(strains): add THC/CBD ratio filter
fix(plants): prevent VPD gauge overflow on mobile
i18n(help): add French translations for FAQ
test(ai): add rate limiter unit tests
```

---

## Code Style

- **TypeScript strict mode** — no `any` types, no `@ts-expect-error`.
- **ESLint 9 flat config** — use the affected-workspace verification below before committing.
- **Tailwind CSS** — use utility classes, avoid custom CSS where possible.
- **Functional components** with hooks — no class components.
- **Named exports** — prefer named over default exports.
- **Memoization** — use `React.memo()` for list items and expensive components with `displayName`.

```bash
# Check for lint errors
pnpm verify:lint

# Type-check without emitting
pnpm verify
```

### Rules

- All `dangerouslySetInnerHTML` content **must** be sanitized with DOMPurify.
- All external links **must** use `rel="noopener noreferrer"`.
- All AI API calls **must** go through `geminiService.ts` (or the provider abstraction).
- No `console.log` in production code. Use `console.debug` (stripped in builds) or `console.warn`/`console.error` for legitimate diagnostics.

### Supply-Chain Security Rules

- All third-party GitHub Actions **must** be pinned to a full 40-character commit SHA. No mutable tags (`@v4`, `@latest`).
- All Dockerfile `FROM` directives **must** include an `@sha256:` digest.
- New third-party actions require adding the owner to the repository's Actions allowlist (Settings > Actions > General).
- Compromised tools are removed immediately and replaced with vetted alternatives (e.g., Trivy -> Grype).
- See [`SECURITY.md`](SECURITY.md#supply-chain-security) for the full policy and rationale (including **[transitive pnpm overrides](SECURITY.md#transitive-dependency-remediation-pnpm-overrides)** for Dependabot-driven fixes).

---

## Desktop (Tauri v2)

CannaGuide builds a Tauri v2 Desktop app alongside the PWA, sharing 99% of the codebase.

### Capability-Based Security

Desktop features require explicit capability permissions in `apps/desktop/src-tauri/capabilities/`. Each capability file grants specific permissions:

| File                | Purpose                   |
| ------------------- | ------------------------- |
| `core.json`         | Window/event management   |
| `desktop.json`      | Tray, shell, process      |
| `fs.json`           | File system with scopes   |
| `dialog.json`       | Native file dialogs       |
| `notification.json` | Native notifications      |
| `tray.json`         | System tray menu          |
| `shortcut.json`     | Global keyboard shortcuts |
| `updater.json`      | Auto-updates              |
| `window-state.json` | Window persistence        |
| `store.json`        | Key-value settings        |

### Rules for Desktop Features

- **Never** add wildcard permissions (`*:all-*`). Use explicit allows.
- **Always** define FS scopes when accessing files. Restrict to `$APPDATA/cannaguide/**`.
- **IPC commands** must be registered in `lib.rs` and exposed via `invoke_handler`.
- **Platform detection** uses `platformService.ts` (`isTauri`, `isPwa`, `isBrowser`).
- **Native APIs** are lazy-loaded to avoid bundling Tauri in web builds.

### Adding a New Desktop Feature

1. Identify required plugin (e.g., `tauri-plugin-clipboard-manager`).
2. Add to `Cargo.toml` and `package.json`.
3. Initialize plugin in `lib.rs` via `.plugin()`.
4. Create capability file in `capabilities/` with minimal permissions.
5. Add capability to `tauri.conf.json` `capabilities` array.
6. Create TypeScript service wrapper with platform detection.
7. Document in ADR-0012.

See [ADR-0012](docs/adr/0012-desktop-tauri-architecture.md) for the full architecture decision.

---

## Testing

We use **Vitest** for unit/integration tests and **Playwright** for E2E tests.

```bash
# Run a relevant unit/integration spec (no extra -- before the file)
pnpm --filter @cannaguide/web test:run path/to/changed.test.ts

# Verify affected workspaces serially; inspect the selected scope first
pnpm verify
pnpm verify:lint
```

### Guidelines

- New features **must** include tests.
- Bug fixes **should** include a regression test.
- Test files live next to their source: `MyComponent.test.tsx` or in `tests/`.
- Use existing mocks from `tests/mocks/` for Gemini, IndexedDB, etc.
- Full coverage and browser tests run in CI. Do not run E2E, Playwright, Stryker or Lighthouse on the low-memory maintainer host. Test counts are maintained by `pnpm run docs:sync-metrics`; historical counts do not prove the current branch passed.

---

## Internationalization (i18n)

All user-facing strings must be localized. We support **English (EN)**, **German (DE)**, **Spanish (ES)**, **French (FR)**, and **Dutch (NL)**.

### Adding translations

1. Add your key to the appropriate namespace in `locales/en/<namespace>.ts`.
2. Add the translations in `locales/de/`, `locales/es/`, `locales/fr/`, and `locales/nl/`.
3. Use the key in your component:
    ```tsx
    const { t } = useTranslation('plants')
    return <p>{t('myNewKey')}</p>
    ```

### Namespaces

`common`, `plants`, `knowledge`, `strains`, `equipment`, `settings`, `help`, `commandPalette`, `onboarding`, `seedbanks`, `strainsData`, `legal`.

### Non-component contexts

Use `getT()` from `i18n.ts` for services and middleware:

```ts
import { getT } from '../i18n'
const t = getT()
console.debug(t('common:error.generic'))
```

---

## Pull Request Process

1. **Open an issue first** to discuss significant changes.
2. Ensure your branch is **up to date** with `main`.
3. Run affordable affected checks and targeted regression specs:
    ```bash
    pnpm verify && pnpm verify:lint
    ```
4. Write a **clear PR description** explaining what changed and why.
5. Link the related issue (e.g., `Closes #42`).
6. Wait for CI checks to pass.
7. A maintainer will review your PR. Be open to feedback!

### PR Checklist

- [ ] Affected TypeScript and lint checks pass (`pnpm verify`, `pnpm verify:lint`)
- [ ] Targeted regression tests pass; exact scope and results are recorded
- [ ] Required current-head CI, including full unit/coverage and Chromium E2E, passes before merge
- [ ] New features include tests
- [ ] Translations added for all 5 languages (EN/DE/ES/FR/NL)
- [ ] No `console.log` statements
- [ ] No `any` types
- [ ] DOMPurify used for any HTML rendering

---

## Reporting Issues

Use the [GitHub Issues](https://github.com/qnbs/CannaGuide-2025/issues) tab. We provide templates for:

- **🐛 Bug Reports** — Describe the problem, steps to reproduce, expected vs. actual behavior.
- **✨ Feature Requests** — Describe the feature, use case, and proposed solution.
- **🔒 Security Reports** — Follow `SECURITY.md` for responsible disclosure.
- **📄 Documentation** — Report inaccurate or missing documentation.
- **🌍 Translation** — Suggest translation improvements or new language support.
- **♿ Accessibility** — Report accessibility barriers or WCAG compliance issues.

### Issue Labels

| Label              | Description                |
| ------------------ | -------------------------- |
| `bug`              | Something isn't working    |
| `enhancement`      | New feature or request     |
| `security`         | Security vulnerability     |
| `documentation`    | Documentation improvements |
| `a11y`             | Accessibility improvements |
| `i18n`             | Translation & localization |
| `good first issue` | Good for newcomers         |
| `help wanted`      | Extra attention needed     |
| `performance`      | Performance improvements   |
| `ai`               | AI/Gemini integration      |
| `pwa`              | PWA & offline behavior     |

---

## Architecture Decisions

When proposing significant changes, please follow these guidelines:

- **State management**: Domain/persistent data in Redux, ephemeral UI state is transient.
- **AI calls**: All AI API calls go through the provider abstraction in `services/`.
- **Security**: All user-facing HTML must use DOMPurify. All external links need `rel="noopener noreferrer"`.
- **Error tracking**: Runtime errors are captured by Sentry. Use `Sentry.captureException()` for explicit error reporting.
- **Testing**: Component tests use Playwright (`tests/ct/`), unit tests use Vitest, E2E tests use Playwright (`tests/e2e/`).

---

## Strain Encyclopedia Contributions

The bundled catalog lives under `apps/web/data/strains/` (776+ entries, versioned via `catalog-version.json`). See [ADR-0014](docs/adr/0014-strain-data-versioning.md).

### Adding or updating a strain

1. Add or edit a `.ts` file under `apps/web/data/strains/` following existing schema (`id`, `name`, `type`, terpenes, provenance when known).
2. **Never change** an existing strain `id` after release — IDs are immutable for genealogy and grow history.
3. Run integrity checks:
    ```bash
    pnpm run strains:check-integrity
    pnpm run strains:check-new-duplicates
    ```
4. Update `catalog-version.json` (`strainCount`, `generatedAt`) when the catalog size changes.
5. Include breeder/source citation in `provenance` when available.

### Automated enrichment (maintainers)

```bash
pnpm run strains:enrich-provenance -- --report --min-confidence=0.7
```

Community PRs with AI-generated strain data require explicit human review.

---

## Deprecation Strategy

When removing or replacing a public API, component, or feature, follow this process to give dependent code a migration window:

### Marking Code as Deprecated

1. Add a **`@deprecated` JSDoc tag** with a migration hint:
    ```ts
    /**
     * @deprecated Use `aiFacade.aiService.getPlantAdvice()` instead.
     * Scheduled for removal in v1.6.
     */
    export function legacyGetAdvice(plantId: string): Promise<string> { ... }
    ```
2. Add a **runtime `console.warn`** on first invocation so developers notice during testing:
    ```ts
    let warned = false
    export function legacyGetAdvice(plantId: string): Promise<string> {
        if (!warned) {
            console.warn('[Deprecated] legacyGetAdvice -- use aiFacade.aiService.getPlantAdvice()')
            warned = true
        }
        // ...
    }
    ```
3. Add a `deprecated` label to the corresponding GitHub Issue (if any).

### Deprecation Timeline

| Phase        | Duration              | Action                                  |
| :----------- | :-------------------- | :-------------------------------------- |
| Announce     | Current release       | Add `@deprecated` tag + runtime warning |
| Grace period | 1 minor release cycle | Keep functional, emit warning           |
| Removal      | Next minor release    | Delete code, update CHANGELOG           |

### Rules

- **Never** remove a public export without a prior deprecation phase.
- Deprecated code **must** still pass typecheck and tests until removal.
- Document the replacement in the `@deprecated` tag body (not just "deprecated").
- Update `CHANGELOG.md` when deprecating (under `### Deprecated`) and when removing (under `### Removed`).

---

## Release Process

Prepare version/changelog changes on a branch and qualify their PR first. Release publication
is a separate maintainer decision, governed by [the release process](docs/release-process.md)
and [GitHub settings](docs/GITHUB-SETTINGS-GUIDE.md). Do not push release changes directly to
main, move existing tags or bypass tag protection. A successful web deployment does not
qualify desktop bundles or publish a release.

---

## Release Housekeeping

Before a release tag or large audit merge, follow [docs/HOUSEKEEPING.md](docs/HOUSEKEEPING.md):

```bash
pnpm run docs:sync-metrics   # README / ARCHITECTURE test counts
pnpm run strains:check-integrity
pnpm verify && pnpm verify:lint
```

Record audit closures against current code and exact qualification evidence; retain dated
reports as historical records. Use CI for the full release/build/coverage/browser checks.

---

## Good First Issues

Looking for a place to start? Here are some beginner-friendly task areas:

| Area                | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **Translations**    | Add or improve ES/FR/NL translations in `apps/web/locales/` (EN/DE are the reference)    |
| **Component Tests** | Add Playwright component tests in `tests/ct/` -- only Button, Card, Input covered so far |
| **Strain Data**     | Enrich strain entries with missing terpene or flavonoid data in `apps/web/data/strains/` |
| **Accessibility**   | Improve ARIA labels, keyboard nav, or screen reader support in UI components             |
| **Documentation**   | Fix typos, improve README sections, or add JSDoc to public service functions             |
| **Theme Variants**  | Create new cannabis theme CSS in `packages/ui/src/tokens.css` (9 themes exist)           |

Look for issues labeled `good first issue` or `help wanted` on the [Issues page](https://github.com/qnbs/CannaGuide-2025/issues).

---

## Thank You!

Every contribution — big or small — makes CannaGuide better for the community. 🌿
