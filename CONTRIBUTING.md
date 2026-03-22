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
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

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
    npm install
    ```
4. **Start the development server**:
    ```bash
    npm run dev
    ```

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10

### Tech Stack

| Category | Technology                          |
| :------- | :---------------------------------- |
| Frontend | React 19 + TypeScript               |
| State    | Redux Toolkit + RTK Query           |
| AI       | Google Gemini API (`@google/genai`) |
| Build    | Vite 7 + vite-plugin-pwa            |
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
- **ESLint 9 flat config** — run `npm run lint` before committing.
- **Tailwind CSS** — use utility classes, avoid custom CSS where possible.
- **Functional components** with hooks — no class components.
- **Named exports** — prefer named over default exports.
- **Memoization** — use `React.memo()` for list items and expensive components with `displayName`.

```bash
# Check for lint errors
npm run lint

# Type-check without emitting
npx tsc --noEmit
```

### Rules

- All `dangerouslySetInnerHTML` content **must** be sanitized with DOMPurify.
- All external links **must** use `rel="noopener noreferrer"`.
- All AI API calls **must** go through `geminiService.ts` (or the provider abstraction).
- No `console.log` in production code. Use `console.debug` (stripped in builds) or `console.warn`/`console.error` for legitimate diagnostics.

---

## Testing

We use **Vitest** for unit/integration tests and **Playwright** for E2E tests.

```bash
# Run all unit/integration tests
npm test

# Run tests in watch mode
npx vitest --watch

# Run E2E tests (requires build)
npm run build && npx playwright test
```

### Guidelines

- New features **must** include tests.
- Bug fixes **should** include a regression test.
- Test files live next to their source: `MyComponent.test.tsx` or in `tests/`.
- Use existing mocks from `tests/mocks/` for Gemini, IndexedDB, etc.
- Current baseline: **529+ tests, 0 failures**.

### Security Alert Baseline (Recommended)

- Run `npm run security:alerts:report` before larger remediation waves.
- Use `docs/security-alerts-status.md` as session handoff baseline.
- For CI automation, trigger `.github/workflows/security-alerts-handoff.yml` manually or rely on the daily schedule (opens/updates an automation PR when report content changes).

---

## Internationalization (i18n)

All user-facing strings must be localized. We support **English (EN)** and **German (DE)**.

### Adding translations

1. Add your key to the appropriate namespace in `locales/en/<namespace>.ts`.
2. Add the German translation in `locales/de/<namespace>.ts`.
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
3. Run the full check suite:
    ```bash
    npx tsc --noEmit && npm run lint && npm test
    ```
4. Write a **clear PR description** explaining what changed and why.
5. Link the related issue (e.g., `Closes #42`).
6. Wait for CI checks to pass.
7. A maintainer will review your PR. Be open to feedback!

### PR Checklist

- [ ] TypeScript compiles with 0 errors (`npx tsc --noEmit`)
- [ ] ESLint passes with 0 warnings (`npm run lint`)
- [ ] All existing tests pass (`npm test`)
- [ ] New features include tests
- [ ] Translations added for EN and DE
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

## Release Process

1. Maintainer bumps version in `package.json`.
2. Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/).
3. Create a tag: `git tag v1.x.0 && git push --tags`.
4. GitHub Actions automatically:
    - Deploys to GitHub Pages and Netlify.
    - Builds Tauri desktop apps (Windows/macOS/Linux).
    - Builds Docker images.
5. Create a GitHub Release with the CHANGELOG excerpt.

---

## Thank You!

Every contribution — big or small — makes CannaGuide better for the community. 🌿
