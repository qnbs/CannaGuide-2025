
# CannaGuide 2025 - Source Code Documentation

This is the central hub for the complete source code documentation of the CannaGuide 2025 application. Due to the size of the project, the documentation has been split into several logical parts.

## Documentation Parts

1.  [**Part 1: Core Architecture & Main Files** (`source-main.md`)](./source-main.md)
    *   Project Overview & Architecture
    *   Directory Structure
    *   `index.html`
    *   `index.tsx`
    *   `App.tsx`
    *   `i18n.ts`
    *   `types.ts`
    *   `constants.ts`

2.  [**Part 2: React Components** (`source-components.md`)](./source-components.md)
    *   Contains the source code for all reusable UI components located in the `/components` directory, organized by feature (common, icons, navigation, views, etc.).

3.  [**Part 3: State Management (Zustand)** (`source-stores.md`)](./source-stores.md)
    *   Details the Zustand store setup, the IndexedDB persistence layer, and the breakdown of each individual state slice.

4.  [**Part 4: Services & Hooks** (`source-services-and-hooks.md`)](./source-services-and-hooks.md)
    *   Covers all business logic encapsulated in services (e.g., `geminiService`, `plantSimulationService`) and all custom React hooks.

5.  [**Part 5: Application Data** (`source-data.md`)](./source-data.md)
    *   Contains the static data assets, including the extensive 480+ strain library and the articles for the knowledge base.

6.  [**Part 6: Internationalization (i18n)** (`source-locales.md`)](./source-locales.md)
    *   Includes all translation files for both English (`en`) and German (`de`), organized by application view.

7.  [**Part 7: Static Assets & PWA Config** (`source-assets.md`)](./source-assets.md)
    *   Contains the project's `metadata.json`, `manifest.json`, the Service Worker (`sw.js`), the main `README.md`, and other static assets.
