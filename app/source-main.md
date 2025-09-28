
# CannaGuide 2025 - Source Code Documentation (Part 1: Core)

This document provides a comprehensive overview of the core files and architecture of the CannaGuide 2025 application.

## 1. Project Overview & Architecture

CannaGuide 2025 is a sophisticated Progressive Web App (PWA) designed as an AI-powered companion for cannabis cultivation. It is built using a modern frontend stack to deliver a rich, interactive, and offline-first experience.

**Core Technologies:**

*   **Framework:** React 19 with TypeScript
*   **State Management:** Zustand with Immer middleware for immutable state updates.
*   **AI:** Google Gemini API (`@google/genai`) for all intelligent features.
*   **Styling:** Tailwind CSS for a utility-first approach.
*   **Data Persistence:** A dual IndexedDB strategy for robust offline capabilities.
*   **Internationalization:** `i18next` for English and German language support.
*   **PWA:** A comprehensive Service Worker (`sw.js`) for offline caching and installability.

## 2. Directory Structure

```
/
├── app/
│   ├── components/       # React components, organized by feature/view
│   ├── constants.ts      # App-wide constants
│   ├── data/             # Static data (strains, knowledge base)
│   ├── hooks/            # Custom React hooks
│   ├── i18n.ts           # Internationalization setup
│   ├── index.html        # Main HTML entry point
│   ├── index.tsx         # React root renderer
│   ├── locales/          # Language translation files
│   ├── services/         # Business logic and API interactions
│   ├── stores/           # Zustand state management
│   ├── types.ts          # TypeScript type definitions
│   ├── App.tsx           # Main application component and view router
│   └── source-*.md       # THIS DOCUMENTATION
├── public/               # Static assets (icons, data chunks)
├── sw.js                 # Service Worker for PWA functionality
└── metadata.json         # Project metadata for AI Studio
```

---

## 3. Core Application Files

### `/index.html`

**Purpose:** The main HTML entry point for the application. It sets up the import map for ES6 modules, defines the app's metadata, includes Tailwind CSS, defines global CSS variables for theming, and mounts the React application.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="importmap">
{
  "imports": {
    "@/": "./",
    "jspdf-autotable": "https://aistudiocdn.com/jspdf-autotable@^3.8.2",
    "jspdf": "https://aistudiocdn.com/jspdf@^2.5.1",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.19.0",
    "react-dom": "https://aistudiocdn.com/react-dom@^19.1.1",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/",
    "react/": "https://aistudiocdn.com/react@^19.1.1/",
    "react": "https://aistudiocdn.com/react@^19.1.1",
    "zustand": "https://aistudiocdn.com/zustand@^4.5.4",
    "i18next": "https://aistudiocdn.com/i18next@^25.5.2",
    "zustand/": "https://aistudiocdn.com/zustand@^5.0.8/",
    "reselect": "https://aistudiocdn.com/reselect@^5.1.1",
    "immer": "https://aistudiocdn.com/immer@^10.1.3",
    "d3": "https://aistudiocdn.com/d3@^7.9.0",
    "immer/": "https://aistudiocdn.com/immer@^10.1.3/"
  }
}
</script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CannaGuide 2025 - Cannabis Grow Guide with Gemini</title>
    <meta name="description" content="Cannabis Grow Guide with Gemini - Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore over 480 strains, get AI equipment advice, and master your grow with an interactive guide." />

    <!-- PWA -->
    <link rel="manifest" href="manifest.json" />
    <meta name="theme-color" content="#0F172A" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="CannaGuide 2025" />
    <link rel="icon" href="favicon.ico" sizes="any" />
    <link rel="icon" href="icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="icon.svg" />

    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <style>
      :root, :root.dark.theme-midnight { color-scheme: dark; --color-bg-primary: 0 0 0; --color-bg-component: 10 10 10; --color-border: 120 120 120; --color-primary-50: 239 246 255; --color-primary-100: 219 234 254; --color-primary-200: 191 219 254; --color-primary-300: 147 197 253; --color-primary-400: 96 165 250; --color-primary-500: 59 130 246; --color-primary-600: 37 99 235; --color-primary-700: 29 78 216; --color-primary-800: 30 64 175; --color-primary-900: 30 58 138; --color-primary-950: 23 37 84; --color-accent-50: 236 254 255; --color-accent-100: 207 250 254; --color-accent-200: 165 243 252; --color-accent-300: 103 232 249; --color-accent-400: 34 211 238; --color-accent-500: 6 182 212; --color-accent-600: 8 145 178; --color-accent-700: 14 116 144; --color-accent-800: 21 94 117; --color-accent-900: 24 78 99; --color-accent-950: 8 46 60; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 255 255 255; --color-neutral-400: 220 220 220; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 23 37 84; }
      :root.dark.theme-forest { color-scheme: dark; --color-bg-primary: 20 31 25; --color-bg-component: 28 44 35; --color-border: 41 61 49; --color-primary-50: 240 253 244; --color-primary-100: 220 252 231; --color-primary-200: 187 247 208; --color-primary-300: 134 239 172; --color-primary-400: 74 222 128; --color-primary-500: 34 197 94; --color-primary-600: 22 163 74; --color-primary-700: 21 128 61; --color-primary-800: 22 101 52; --color-primary-900: 20 83 45; --color-primary-950: 5 46 22; --color-accent-50: 236 252 241; --color-accent-100: 209 250 229; --color-accent-200: 167 243 208; --color-accent-300: 110 231 183; --color-accent-400: 52 211 153; --color-accent-500: 16 185 129; --color-accent-600: 5 150 105; --color-accent-700: 4 120 87; --color-accent-800: 6 95 70; --color-accent-900: 6 78 59; --color-accent-950: 3 44 34; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 5 46 22; }
      :root.dark.theme-purpleHaze { color-scheme: dark; --color-bg-primary: 28 25 45; --color-bg-component: 40 37 68; --color-border: 55 51 86; --color-primary-50: 245 243 255; --color-primary-100: 238 234 254; --color-primary-200: 224 218 255; --color-primary-300: 198 189 255; --color-primary-400: 163 148 255; --color-primary-500: 128 109 251; --color-primary-600: 110 87 248; --color-primary-700: 93 68 227; --color-primary-800: 77 54 186; --color-primary-900: 64 45 153; --color-primary-950: 37 26 89; --color-accent-50: 252 246 255; --color-accent-100: 247 236 255; --color-accent-200: 239 219 255; --color-accent-300: 227 194 255; --color-accent-400: 210 159 255; --color-accent-500: 192 121 255; --color-accent-600: 173 83 248; --color-accent-700: 149 57 222; --color-accent-800: 122 46 179; --color-accent-900: 100 39 146; --color-accent-950: 67 19 98; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 255 255 255; }
      :root.dark.theme-desertSky { color-scheme: dark; --color-bg-primary: 38 34 50; --color-bg-component: 56 50 71; --color-border: 71 63 90; --color-primary-50: 247 243 255; --color-primary-100: 237 232 253; --color-primary-200: 221 214 254; --color-primary-300: 196 181 253; --color-primary-400: 167 139 250; --color-primary-500: 139 92 246; --color-primary-600: 124 58 237; --color-primary-700: 109 40 217; --color-primary-800: 91 33 182; --color-primary-900: 76 29 149; --color-primary-950: 46 16 101; --color-accent-50: 254 245 231; --color-accent-100: 253 230 138; --color-accent-200: 252 211 77; --color-accent-300: 251 191 36; --color-accent-400: 245 158 11; --color-accent-500: 217 119 6; --color-accent-600: 180 83 9; --color-accent-700: 146 64 14; --color-accent-800: 120 53 15; --color-accent-900: 99 44 19; --color-accent-950: 57 25 10; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 46 16 101; }
      :root.dark.theme-roseQuartz { color-scheme: dark; --color-bg-primary: 31 26 34; --color-bg-component: 47 38 52; --color-border: 66 53 72; --color-primary-50: 253 242 248; --color-primary-100: 252 231 243; --color-primary-200: 251 207 232; --color-primary-300: 249 168 212; --color-primary-400: 244 114 182; --color-primary-500: 236 72 153; --color-primary-600: 219 39 119; --color-primary-700: 190 24 93; --color-primary-800: 157 23 77; --color-primary-900: 131 24 67; --color-primary-950: 86 10 39; --color-accent-50: 254 240 254; --color-accent-100: 251 222 251; --color-accent-200: 245 190 245; --color-accent-300: 232 142 232; --color-accent-400: 217 99 217; --color-accent-500: 200 63 200; --color-accent-600: 172 45 172; --color-accent-700: 147 37 147; --color-accent-800: 120 34 120; --color-accent-900: 99 29 99; --color-accent-950: 67 14 67; --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23; --color-text-on-accent: 255 255 255; }
    </style>
    <style>
      body {
        background-color: rgb(var(--color-bg-primary));
        color: rgb(var(--color-neutral-300));
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      .glass-pane {
        background-color: rgb(var(--color-bg-component) / 0.5);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgb(var(--color-border) / 0.5);
        box-shadow: 0 0 0 1px rgba(var(--color-bg-primary), 0.1), 0 2px 4px rgba(0,0,0,0.1);
      }

      #toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-end;
      }

      .toast {
        background-color: rgb(var(--color-bg-component));
        border: 1px solid rgb(var(--color-border));
        transition: all 0.3s ease-in-out;
      }

      .toast-entering {
        opacity: 0;
        transform: translateX(100%);
      }
      .toast-entered {
        opacity: 1;
        transform: translateX(0);
      }
      .toast-exiting {
        opacity: 0;
        transform: scale(0.9);
      }

      .skeleton-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes pulse {
        50% {
          opacity: 0.5;
        }
      }

      @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
      }

      /* For Favorite Button Glow */
      .favorite-btn-glow {
          transition: color 0.3s ease;
      }
      .favorite-btn-glow.is-favorite {
          color: rgb(var(--color-primary-400));
          animation: favorite-glow 1.5s ease-in-out;
      }

      @keyframes favorite-glow {
        0% { text-shadow: 0 0 5px rgba(var(--color-primary-400), 0); }
        50% { text-shadow: 0 0 20px rgba(var(--color-primary-400), 0.8); }
        100% { text-shadow: 0 0 5px rgba(var(--color-primary-400), 0); }
      }

      /* Range Slider Styles */
      .range-slider-input {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        background: transparent;
        cursor: pointer;
        position: absolute;
        pointer-events: none;
      }

      .range-slider-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background-color: var(--thumb-color, #3b82f6);
        border-radius: 50%;
        border: 2px solid rgb(var(--color-bg-component));
        pointer-events: auto;
        transition: transform 0.2s ease, background-color 0.2s ease;
        transform: scale(var(--thumb-scale, 1));
      }

      .range-slider-input::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background-color: var(--thumb-color, #3b82f6);
        border-radius: 50%;
        border: 2px solid rgb(var(--color-bg-component));
        pointer-events: auto;
        transition: transform 0.2s ease, background-color 0.2s ease;
        transform: scale(var(--thumb-scale, 1));
      }

      .history-chart-grid line,
      .history-chart-grid path {
        stroke: rgb(var(--color-border));
        stroke-opacity: 0.5;
      }
      .history-chart-labels {
        fill: rgb(var(--color-neutral-400));
        font-size: 10px;
        font-family: 'IBM Plex Mono', monospace;
      }
      
      .offline-banner {
        background-color: rgb(var(--color-primary-800));
        color: rgb(var(--color-primary-100));
        text-align: center;
        padding: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .card-interactive-glow {
        position: relative;
        overflow: hidden;
        transition: transform 0.2s ease-in-out, border-color 0.2s ease-in-out;
      }
      .card-interactive-glow:hover {
        transform: translateY(-4px);
        border-color: rgba(var(--color-primary-500), 0.5);
      }
      .card-interactive-glow::before {
        content: '';
        position: absolute;
        left: var(--x, 50%);
        top: var(--y, 50%);
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(var(--color-primary-500), 0.15) 0%, rgba(var(--color-primary-500), 0) 60%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      .card-interactive-glow:hover::before {
        opacity: 1;
      }

      @keyframes fade-in-overlay {
          from { opacity: 0; }
          to { opacity: 1; }
      }
      .modal-overlay-animate {
          animation: fade-in-overlay 0.3s ease-out forwards;
      }

      @keyframes slide-in-up {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .modal-content-animate {
        animation: slide-in-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
      
      .animate-slide-in-up {
          animation: slide-in-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }

      @keyframes fade-in-stagger {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-stagger {
          animation: fade-in-stagger 0.4s ease-out forwards;
          opacity: 0;
      }

      /* Custom Scrollbar Styles */
      /* For Webkit-based browsers (Chrome, Safari, Edge) */
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }

      ::-webkit-scrollbar-track {
        background: rgb(var(--color-bg-primary));
      }

      ::-webkit-scrollbar-thumb {
        background-color: rgb(var(--color-bg-component));
        border-radius: 6px;
        border: 3px solid rgb(var(--color-bg-primary));
      }

      ::-webkit-scrollbar-thumb:hover {
        background-color: rgb(var(--color-border));
      }
      
       .no-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

      /* For Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgb(var(--color-bg-component)) rgb(var(--color-bg-primary));
      }

      kbd {
        background-color: rgb(var(--color-bg-primary));
        border: 1px solid rgb(var(--color-border));
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 0.75em;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        color: rgb(var(--color-neutral-300));
      }
      
      /* Accessibility & UI Styles */
      .dyslexia-font, .dyslexia-font body {
        font-family: 'IBM Plex Mono', monospace !important;
      }
      .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      .ui-density-compact .glass-pane,
      .ui-density-compact .card-interactive,
      .ui-density-compact .p-4 {
        padding: 0.75rem; /* 12px */
      }
       .ui-density-compact .py-2 {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
       }
       .ui-density-compact .text-sm {
        font-size: 0.8rem;
       }
       .ui-density-compact .text-xs {
        font-size: 0.7rem;
       }
       
      /* TTS Styles */
      .tts-disabled .speakable-button {
          display: none !important;
      }
      .speakable-highlight {
          background-color: rgb(var(--color-primary-800) / 0.4);
          box-shadow: inset 0 0 0 2px rgb(var(--color-primary-500));
          border-radius: 4px;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      }
      
      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 5px rgba(var(--color-primary-500), 0.2);
        }
        50% {
          box-shadow: 0 0 20px rgba(var(--color-primary-500), 0.7);
        }
      }
      .animate-pulse-glow {
        animation: pulse-glow 2s infinite;
      }
      
      /* Form Element Styles */
      .select-input, .input-base {
        background-color: rgb(var(--color-neutral-800));
        border: 1px solid rgb(var(--color-neutral-700));
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        color: rgb(var(--color-neutral-300));
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      
      .select-input {
        -webkit-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
      }
      
      .select-input:focus, .input-base:focus {
        outline: none;
        border-color: rgb(var(--color-primary-500));
        box-shadow: 0 0 0 2px rgb(var(--color-primary-500) / 0.5);
      }
    </style>
    <script>
      tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: { 50: 'rgb(var(--color-primary-50) / <alpha-value>)', 100: 'rgb(var(--color-primary-100) / <alpha-value>)', 200: 'rgb(var(--color-primary-200) / <alpha-value>)', 300: 'rgb(var(--color-primary-300) / <alpha-value>)', 400: 'rgb(var(--color-primary-400) / <alpha-value>)', 500: 'rgb(var(--color-primary-500) / <alpha-value>)', 600: 'rgb(var(--color-primary-600) / <alpha-value>)', 700: 'rgb(var(--color-primary-700) / <alpha-value>)', 800: 'rgb(var(--color-primary-800) / <alpha-value>)', 900: 'rgb(var(--color-primary-900) / <alpha-value>)', 950: 'rgb(var(--color-primary-950) / <alpha-value>)' }, accent: { 50: 'rgb(var(--color-accent-50) / <alpha-value>)', 100: 'rgb(var(--color-accent-100) / <alpha-value>)', 200: 'rgb(var(--color-accent-200) / <alpha-value>)', 300: 'rgb(var(--color-accent-300) / <alpha-value>)', 400: 'rgb(var(--color-accent-400) / <alpha-value>)', 500: 'rgb(var(--color-accent-500) / <alpha-value>)', 600: 'rgb(var(--color-accent-600) / <alpha-value>)', 700: 'rgb(var(--color-accent-700) / <alpha-value>)', 800: 'rgb(var(--color-accent-800) / <alpha-value>)', 900: 'rgb(var(--color-accent-900) / <alpha-value>)', 950: 'rgb(var(--color-accent-950) / <alpha-value>)' }, slate: { 50: 'rgb(var(--color-neutral-50) / <alpha-value>)', 100: 'rgb(var(--color-neutral-100) / <alpha-value>)', 200: 'rgb(var(--color-neutral-200) / <alpha-value>)', 300: 'rgb(var(--color-neutral-300) / <alpha-value>)', 400: 'rgb(var(--color-neutral-400) / <alpha-value>)', 500: 'rgb(var(--color-neutral-500) / <alpha-value>)', 600: 'rgb(var(--color-neutral-600) / <alpha-value>)', 700: 'rgb(var(--color-neutral-700) / <alpha-value>)', 800: 'rgb(var(--color-neutral-800) / <alpha-value>)', 900: 'rgb(var(--color-neutral-900) / <alpha-value>)', 950: 'rgb(var(--color-neutral-950) / <alpha-value>)' }, 'on-accent': 'rgb(var(--color-text-on-accent) / <alpha-value>)', }, fontFamily: { sans: ['Inter', 'sans-serif'], display: ['Lexend', 'sans-serif'], mono: ['IBM Plex Mono', 'monospace'], } } }, }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <div id="toast-container"></div>
    <script type="module" src="index.tsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js')
            .then(registration => {
              console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
              console.log('ServiceWorker registration failed: ', error);
            });
        });
      }
    </script>
  </body>
</html>
```

### `/index.tsx`

**Purpose:** This is the primary entry point for the React application. It finds the `root` DOM element and renders the main `<App />` component into it. Crucially, it waits for the `i18n` translations to be loaded before rendering, preventing any "flash of untranslated content".

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Changed import paths to be relative.
import { App } from './App';
import { i18nPromise } from './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Wait for translations to load before rendering the app
i18nPromise.then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
});
```

### `/App.tsx`

**Purpose:** This is the root component of the application. It orchestrates the main layout (Header, Main Content, Bottom Navigation), manages global modals (Onboarding, Command Palette), handles PWA installation logic, and acts as the primary view router. It also initializes services and sets up global effects.

```typescript
import React, { useState, useEffect, useRef } from 'react';
// FIX: Changed import paths to be relative
import { View } from './types';
import { useAppStore } from './stores/useAppStore';
import { useTranslations } from './hooks/useTranslations';
import { ToastContainer } from './components/common/Toast';
import { Header } from './components/navigation/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { StrainsView } from './components/views/StrainsView';
import { PlantsView } from './components/views/PlantsView';
import { EquipmentView } from './components/views/EquipmentView';
import { KnowledgeView } from './components/views/KnowledgeView';
import { SettingsView } from './components/views/SettingsView';
import { HelpView } from './components/views/HelpView';
import { OnboardingModal } from './components/common/OnboardingModal';
import { CommandPalette } from './components/common/CommandPalette';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePwaInstall } from './hooks/usePwaInstall';
import { strainService } from './services/strainService';
import { selectActiveView, selectIsCommandPaletteOpen } from './stores/slices/uiSlice';
import { selectSettings } from './stores/slices/settingsSlice';
import { TTSControls } from './components/common/TTSControls';
import { ttsService } from './services/ttsService';
import { useDocumentEffects } from './hooks/useDocumentEffects';
import { AiLoadingIndicator } from './components/common/AiLoadingIndicator';
import { CannabisLeafIcon } from './components/icons/CannabisLeafIcon';
import { simulationManager } from './services/SimulationManager';
import { i18nInstance } from './i18n';
import { LogActionModalContainer } from './components/views/plants/LogActionModalContainer';
import { DeepDiveModalContainer } from './components/views/plants/deepDive/DeepDiveModalContainer';

const LoadingGate: React.FC = () => {
    const { t } = useTranslations();
    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans items-center justify-center" role="status" aria-live="polite">
            <CannabisLeafIcon className="w-24 h-24 text-primary-500 animate-pulse" />
            <p className="mt-4 text-lg font-semibold text-slate-400">
                {t('common.preparingGuide')}
            </p>
        </div>
    );
};

const ToastManager: React.FC = () => {
    const notifications = useAppStore(state => state.notifications);
    const removeNotification = useAppStore(state => state.removeNotification);
    return <ToastContainer notifications={notifications} onClose={removeNotification} />;
};

const SimulationStatusOverlay: React.FC = () => {
    const { t } = useTranslations();
    const isCatchingUp = useAppStore(state => state.isCatchingUp);
    
    if (!isCatchingUp) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[200] flex items-center justify-center backdrop-blur-sm">
            <AiLoadingIndicator loadingMessage={t('plantsView.syncProgress')} />
        </div>
    );
};

const AppContent: React.FC = () => {
    const settings = useAppStore(selectSettings);
    const activeView = useAppStore(selectActiveView);
    const isCommandPaletteOpen = useAppStore(selectIsCommandPaletteOpen);
    const mainContentRef = useRef<HTMLElement | null>(null);
    
    const { setSetting, setIsCommandPaletteOpen, addNotification } = useAppStore(state => ({
        setSetting: state.setSetting,
        setIsCommandPaletteOpen: state.setIsCommandPaletteOpen,
        addNotification: state.addNotification,
    }));
    
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(!settings.onboardingCompleted);
    const { t } = useTranslations();
    const isOffline = useOnlineStatus();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();

    useDocumentEffects(settings);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
    }, [activeView]);

    useEffect(() => {
        if (isOffline) {
            addNotification(t('common.offlineWarning'), 'info');
        }
    }, [isOffline, addNotification, t]);

    const handleOnboardingClose = () => {
        setSetting('onboardingCompleted', true);
        setIsOnboardingOpen(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(!isCommandPaletteOpen);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);
    
    const OfflineBanner = () => {
        if (!isOffline) return null;
        return <div className="offline-banner">{t('common.offlineWarning')}</div>;
    };

    const renderView = () => {
        switch (activeView) {
            case View.Strains: return <StrainsView />;
            case View.Plants: return <PlantsView />;
            case View.Equipment: return <EquipmentView />;
            case View.Knowledge: return <KnowledgeView />;
            case View.Settings: return <SettingsView deferredPrompt={deferredPrompt} onInstallClick={handleInstallClick} />;
            case View.Help: return <HelpView />;
            default: return <PlantsView />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans">
            <SimulationStatusOverlay />
            {isOnboardingOpen && <OnboardingModal onClose={handleOnboardingClose} />}
            <CommandPalette 
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
            />
            <LogActionModalContainer />
            <DeepDiveModalContainer />
            <Header 
                onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
                deferredPrompt={deferredPrompt}
                isInstalled={isInstalled}
                onInstallClick={handleInstallClick}
            />
            <OfflineBanner />
            <main ref={mainContentRef} className="flex-grow overflow-y-auto p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {renderView()}
                </div>
            </main>
             <TTSControls />
            <BottomNav />
        </div>
    );
};

export const App: React.FC = () => {
    const { isAppReady, setAppReady } = useAppStore(state => ({
        isAppReady: state.isAppReady,
        setAppReady: state.setAppReady,
    }));
    
    useEffect(() => {
        const initializeApp = async () => {
            setAppReady(false);
            await strainService.init();
            await simulationManager.initialize();
            setAppReady(true);
        };
        initializeApp();
    }, [setAppReady]);

    useEffect(() => {
        // Initialize TTS service
        ttsService.init();

        // Subscribe to simulation setting changes
        const unsubscribeSim = useAppStore.subscribe(
            state => state.settings.simulationSettings,
            () => simulationManager.update()
        );

        // Subscribe to language changes
        const unsubscribeLang = useAppStore.subscribe(
            state => state.settings.language,
            (lang) => {
                if (lang && i18nInstance.language !== lang) {
                    i18nInstance.changeLanguage(lang);
                }
            }
        );

        // Perform an initial language sync after the store has been hydrated.
        const hydratedLanguage = useAppStore.getState().settings.language;
        if (i18nInstance.language !== hydratedLanguage) {
            i18nInstance.changeLanguage(hydratedLanguage);
        }

        return () => {
            unsubscribeSim();
            unsubscribeLang();
        };
    }, []);
    
    if (!isAppReady) {
        return <LoadingGate />;
    }

    return (
        <>
            <AppContent />
            <ToastManager />
        </>
    );
};
```

### `/i18n.ts`

**Purpose:** Initializes the `i18next` instance for internationalization. It configures the available languages (English and German) and resources. The initialization is exported as a promise (`i18nPromise`), which the application awaits before rendering to ensure translations are ready.

```typescript
import i18next from 'i18next';
import { de, en } from './locales';

// Create a direct instance of i18next
export const i18nInstance = i18next.createInstance();

// Detect initial language from browser settings. The store will sync it up later upon hydration.
const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

// The initialization is now a promise that the app will wait for
export const i18nPromise = i18nInstance.init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        de: { translation: de },
    },
    interpolation: {
        escapeValue: false, // React already handles escaping
    },
});

// The subscription logic will be moved to a component like App.tsx
// to ensure the store is initialized before subscribing.
```

### `/types.ts`

**Purpose:** This file is the single source of truth for all TypeScript types and interfaces used throughout the application. It defines the shape of core data structures like `Strain` and `Plant`, as well as enums for consistent state representation (e.g., `View`, `PlantStage`).

```typescript
import type React from 'react';
import { StateCreator } from 'zustand';
import { WritableDraft } from 'immer/dist/internal';

// FIX: Changed import paths to be relative for all store slices.
import { AiSlice } from "./stores/slices/aiSlice";
import { ArchivesSlice } from "./stores/slices/archivesSlice";
import { FavoritesSlice } from "./stores/slices/favoritesSlice";
import { KnowledgeSlice } from "./stores/slices/knowledgeSlice";
import { NotesSlice } from "./stores/slices/notesSlice";
import { PlantSlice } from "./stores/slices/plantSlice";
import { SavedItemsSlice } from "./stores/slices/savedItemsSlice";
import { SettingsSlice } from "./stores/slices/settingsSlice";
import { StrainsViewSlice } from "./stores/slices/strainsViewSlice";
import { TTSSlice } from "./stores/slices/ttsSlice";
import { UISlice } from "./stores/slices/uiSlice";
import { UserStrainsSlice } from "./stores/slices/userStrainsSlice";
import { SimulationSlice } from "./stores/slices/simulationSlice";
import { BreedingSlice } from "./stores/slices/breedingSlice";

// --- ENUMS & LITERAL TYPES ---

export type Language = 'en' | 'de';
export type Theme = 'midnight' | 'forest' | 'purpleHaze' | 'desertSky' | 'roseQuartz';
// FIX: Changed View from a type to an enum to be able to reference its values.
export enum View {
    Strains = 'Strains',
    Plants = 'Plants',
    Equipment = 'Equipment',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    Help = 'Help'
}
export type StrainType = 'Sativa' | 'Indica' | 'Hybrid';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type YieldLevel = 'Low' | 'Medium' | 'High';
export type HeightLevel = 'Short' | 'Medium' | 'Tall';
export type FloweringType = 'Photoperiod' | 'Autoflower';
export type SortDirection = 'asc' | 'desc';
export type SortKey = 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'difficulty' | 'yield';
export type StrainViewTab = 'all' | 'my-strains' | 'favorites' | 'exports' | 'tips';
export type EquipmentViewTab = 'configurator' | 'calculators' | 'setups' | 'grow-shops';
export type KnowledgeViewTab = 'mentor' | 'guide' | 'archive' | 'breeding';
export type ExportSource = 'selected' | 'all';
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml';
export type UiDensity = 'comfortable' | 'compact';
export type NotificationType = 'success' | 'error' | 'info';
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation';
export type ModalType = 'watering' | 'feeding' | 'training' | 'pestControl' | 'observation' | 'photo' | 'amendment';

export enum PlantStage {
    Seed = 'SEED',
    Germination = 'GERMINATION',
    Seedling = 'SEEDLING',
    Vegetative = 'VEGETATIVE',
    Flowering = 'FLOWERING',
    Harvest = 'HARVEST',
    Drying = 'DRYING',
    Curing = 'CURING',
    Finished = 'FINISHED',
}

export enum ProblemType {
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    NutrientBurn = 'NUTRIENT_BURN',
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    phTooLow = 'PH_TOO_LOW',
    phTooHigh = 'PH_TOO_HIGH',
    tempTooHigh = 'TEMP_TOO_HIGH',
    tempTooLow = 'TEMP_TOO_LOW',
    humidityTooHigh = 'HUMIDITY_TOO_HIGH',
    humidityTooLow = 'HUMIDITY_TOO_LOW',
    vpdTooLow = 'VPD_TOO_LOW',
    vpdTooHigh = 'VPD_TOO_HIGH',
    Pest = 'PEST',
}

// --- CORE DATA STRUCTURES ---

export interface Strain {
    id: string;
    name: string;
    type: StrainType;
    typeDetails ? : string;
    genetics ? : string;
    floweringType: FloweringType;
    thc: number;
    cbd: number;
    thcRange ? : string;
    cbdRange ? : string;
    floweringTime: number;
    floweringTimeRange ? : string;
    description ? : string;
    agronomic: {
        difficulty: DifficultyLevel;
        yield: YieldLevel;
        height: HeightLevel;
        yieldDetails ? : {
            indoor: string;
            outdoor: string
        };
        heightDetails ? : {
            indoor: string;
            outdoor: string
        };
    };
    aromas ? : string[];
    dominantTerpenes ? : string[];
    idealConditions ? : {
        phRange ? : [number, number];
        ecRange ? : [number, number];
        tempRange ? : [number, number];
        humidityRange ? : [number, number];
    };
}

export interface Plant {
    id: string;
    name: string;
    strain: Strain;
    createdAt: number;
    age: number; // in days
    stage: PlantStage;
    height: number; // in cm
    biomass: number; // in grams
    health: number; // 0-100
    stressLevel: number; // 0-100
    isTopped: boolean;
    structuralModel: StructuralModel;
    cannabinoids: {
        thc: number,
        cbd: number
    };
    terpenes: number;
    postHarvest ? : PostHarvestData;
    substrate: {
        type: 'Soil' | 'Coco' | 'Hydro';
        ph: number;
        ec: number;
        moisture: number; // 0-100%
        volumeLiters: number;
        microbeHealth: number; // 0-100
    };
    environment: {
        temperature: number; // Ambient temp
        humidity: number; // Ambient humidity
        vpd: number;
        internalTemperature: number;
        internalHumidity: number;
        co2Level: number;
    };
    equipment: {
        light: {
            type: 'LED' | 'HPS' | 'CFL',
            wattage: number,
            isOn: boolean
        };
        fan: {
            isOn: boolean,
            speed: number
        };
    };
    rootSystem: {
        rootMass: number;
        rootHealth: number;
    };
    tasks: Task[];
    problems: PlantProblem[];
    journal: JournalEntry[];
    history: PlantHistoryEntry[];
}

// --- SUB-STRUCTURES ---

export interface StructuralModel {
    nodes: {
        id: string;
        age: number;
    }[];
    shoots: {
        id: string;
        length: number;
        angle: number;
        isMain: boolean;
        nodeIndex: number;
    }[];
}

export interface PostHarvestData {
    dryWeight: number;
    finalQuality: number;
    currentDryDay: number;
    currentCureDay: number;
    jarHumidity: number;
    lastBurpDay: number;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    isCompleted: boolean;
    createdAt: number;
    completedAt ? : number;
}

export interface PlantProblem {
    type: ProblemType;
    status: 'active' | 'resolved';
    detectedAt: number;
    resolvedAt ? : number;
}

export type JournalEntryType = 'WATERING' | 'FEEDING' | 'TRAINING' | 'OBSERVATION' | 'SYSTEM' | 'PHOTO' | 'PEST_CONTROL' | 'ENVIRONMENT' | 'AMENDMENT';
export interface JournalEntry {
    id: string;
    createdAt: number;
    type: JournalEntryType;
    notes: string;
    details ? : Record < string, any > ;
}

export interface PlantHistoryEntry {
    day: number;
    height: number;
    health: number;
    stressLevel: number;
    substrate: {
        ph: number;
        ec: number;
        moisture: number;
    };
}

// --- SETTINGS ---
export interface DefaultGrowSetup {
    light: {
        type: 'LED' | 'HPS' | 'CFL';
        wattage: number
    };
    potSize: number;
    medium: 'Soil' | 'Coco' | 'Hydro';
}
export interface GrowSetup {
    lightType: 'LED' | 'HPS' | 'CFL';
    wattage: number;
    potSize: number;
    medium: 'Soil' | 'Coco' | 'Hydro';
    temperature: number;
    humidity: number;
    lightHours: number;
}
export interface AppSettings {
    language: Language;
    theme: Theme;
    fontSize: 'sm' | 'base' | 'lg';
    defaultView: View;
    strainsViewSettings: {
        defaultSortKey: SortKey;
        defaultSortDirection: SortDirection;
        defaultViewMode: 'list' | 'grid';
        visibleColumns: {
            type: boolean;
            thc: boolean;
            cbd: boolean;
            floweringTime: boolean;
            yield: boolean;
            difficulty: boolean;
        };
    };
    notificationsEnabled: boolean;
    notificationSettings: {
        stageChange: boolean;
        problemDetected: boolean;
        harvestReady: boolean;
        newTask: boolean;
    };
    onboardingCompleted: boolean;
    simulationSettings: {
        autoAdvance: boolean;
        speed: '1x' | '2x' | '4x';
        difficulty: 'easy' | 'normal' | 'hard' | 'custom';
        customDifficultyModifiers: {
            pestPressure: number;
            nutrientSensitivity: number;
            environmentalStability: number;
        };
        autoJournaling: {
            stageChanges: boolean;
            problems: boolean;
            tasks: boolean;
        };
    };
    defaultGrowSetup: DefaultGrowSetup;
    defaultJournalNotes: {
        watering: string;
        feeding: string;
    };
    defaultExportSettings: {
        source: ExportSource;
        format: ExportFormat;
    };
    lastBackupTimestamp ? : number;
    accessibility: {
        reducedMotion: boolean;
        dyslexiaFont: boolean;
    };
    uiDensity: UiDensity;
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
    tts: TTSSettings;
}

// --- UI & APP STATE ---

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

export interface Command {
    id: string;
    title: string;
    subtitle ? : string;
    icon: React.ElementType;
    action: () => void;
    keywords ? : string;
    shortcut ? : string[];
    group: string;
    isHeader ? : boolean;
}

export interface StoredImageData {
    id: string;
    data: string; // base64 data URL
    createdAt: number;
}

// --- AI & API RELATED ---

export interface AIResponse {
    title: string;
    content: string; // Can be markdown
}

export interface PlantDiagnosisResponse {
    title: string;
    confidence: number;
    diagnosis: string;
    immediateActions: string;
    longTermSolution: string;
    prevention: string;
}

export interface MentorMessage {
    role: 'user' | 'model';
    content: string;
    title ? : string;
}

export interface StructuredGrowTips {
    nutrientTip: string;
    trainingTip: string;
    environmentalTip: string;
    proTip: string;
}

export interface DeepDiveGuide {
    introduction: string;
    stepByStep: string[];
    prosAndCons: {
        pros: string[];
        cons: string[];
    };
    proTip: string;
    svgIcon: string;
}

export type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';
export interface RecommendationItem {
    name: string;
    price: number;
    rationale: string;
    watts ? : number;
}
export type Recommendation = Record < RecommendationCategory, RecommendationItem > ;

// --- SAVED ITEMS ---

export interface SavedSetup {
    id: string;
    name: string;
    createdAt: number;
    recommendation: Recommendation;
    totalCost: number;
    sourceDetails: {
        area: string;
        budget: string;
        growStyle: string;
    };
}

export interface SavedExport {
    id: string;
    name: string;
    createdAt: number;
    source: ExportSource;
    format: ExportFormat;
    count: number;
    strainIds: string[];
    notes ? : string;
}

export interface ArchivedMentorResponse {
    id: string;
    createdAt: number;
    query: string;
    title: string;
    content: string;
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string;
    createdAt: number;
    plantId: string;
    plantStage: PlantStage;
    query: string; // The plant data JSON string
}

export interface SavedStrainTip extends AIResponse {
    id: string;
    createdAt: number;
    strainId: string;
    strainName: string;
}


// --- KNOWLEDGE BASE ---
export interface KnowledgeArticle {
    id: string;
    titleKey: string;
    contentKey: string;
    tags: string[];
    triggers: {
        plantStage ? : PlantStage | PlantStage[];
        ageInDays ? : {
            min: number;
            max: number
        };
        activeProblems ? : ProblemType[];
    }
}

export type KnowledgeProgress = Record < string, string[] > ; // sectionId: itemId[]

// --- MISC ---
export interface StrainTranslationData {
    description ? : string;
    typeDetails ? : string;
    genetics ? : string;
    yieldDetails ? : {
        indoor: string;
        outdoor: string;
    };
    heightDetails ? : {
        indoor: string;
        outdoor: string;
    };
}

export interface SpeechQueueItem {
    id: string;
    text: string;
}
export interface TTSSettings {
    enabled: boolean;
    rate: number;
    pitch: number;
    voiceName: string | null;
}

export interface Scenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    durationDays: number;
    plantAModifier: {
        action: ScenarioAction;
        day: number
    };
    plantBModifier: {
        action: ScenarioAction;
        day: number
    };
}
export type ScenarioAction = 'TOP' | 'LST' | 'NONE';

// --- ENDGAME ---
export interface Seed {
    id: string;
    name: string;
    strainId: string;
    genetics: string;
    quality: number;
    createdAt: number;
}


// --- APP STATE ---
export type AppState =
    AiSlice &
    ArchivesSlice &
    BreedingSlice &
    FavoritesSlice &
    KnowledgeSlice &
    NotesSlice &
    PlantSlice &
    SavedItemsSlice &
    SettingsSlice &
    SimulationSlice &
    StrainsViewSlice &
    TTSSlice &
    UISlice &
    UserStrainsSlice;
    
// A generic type for creating Zustand slices with Immer and full AppState access
export type MyStateCreator<T> = StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  T
>;
```

### `/constants.ts`

**Purpose:** This file exports app-wide constants that do not change, such as the ordered list of plant stages. This ensures consistency and avoids magic strings/numbers in the codebase.

```typescript
// FIX: Changed import path to be relative
import { PlantStage } from './types';

export const STAGES_ORDER: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
    PlantStage.Drying,
    PlantStage.Curing,
    PlantStage.Finished,
];

export const FLOWERING_STAGES: PlantStage[] = [
    PlantStage.Flowering,
    PlantStage.Harvest,
];
```
