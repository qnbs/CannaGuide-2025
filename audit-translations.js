/**
 * CannaGuide 2025 - Translation Key Audit Script
 * 
 * This script recursively compares the German and English translation files
 * to find missing keys in either language. It helps ensure that all text
 * in the application can be translated correctly.
 * 
 * How to run:
 * 1. Open your terminal or command prompt.
 * 2. Navigate to the root directory of the CannaGuide project.
 * 3. Run the script using Node.js:
 *    node audit-translations.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- Configuration ---
const basePath = path.join(__dirname, 'locales');
const languages = ['de', 'en'];
const referenceLanguage = 'de'; // Check all other languages against German

// List of modules to check, based on index.ts files
const modules = [
    'common', 'commandPalette', 'equipment', 'help', 
    'knowledge', 'onboarding', 'plants', 'settings', 'strains'
];

// --- Helper Functions ---

/**
 * Reads a TypeScript module file as text and safely evaluates its exported objects.
 * @param {string} filePath - The full path to the .ts file.
 * @returns {object} An object containing all exported constants from the file.
 */
function parseModule(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`ERROR: File not found: ${filePath}`);
        return {};
    }
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        // Create a sandbox to safely evaluate the code
        const sandbox = {};
        vm.createContext(sandbox);
        // We replace 'export const' with 'this.' to make it valid script code for vm
        // and handle various export syntaxes.
        const scriptContent = fileContent
            .replace(/export const /g, 'this.')
            .replace(/import .* from '.*';/g, '') // Remove imports
            .replace(/import type .* from '.*';/g, ''); // Remove type imports

        vm.runInContext(scriptContent, sandbox);
        return sandbox;
    } catch (e) {
        console.error(`ERROR: Could not parse file ${filePath}`, e);
        return {};
    }
}

/**
 * Loads all translation modules for a specific language and assembles the final object.
 * @param {string} lang - The language code ('de' or 'en').
 * @returns {object} The complete translation object for the language.
 */
function loadLanguageTranslations(lang) {
    let langData = {};
    modules.forEach(moduleName => {
        const filePath = path.join(basePath, lang, `${moduleName}.ts`);
        const parsedModule = parseModule(filePath);
        langData = { ...langData, ...parsedModule };
    });
    return langData;
}

/**
 * Recursively compares keys between two objects and logs warnings for missing keys.
 * @param {object} refObj - The reference object.
 * @param {object} compObj - The object to compare against.
 * @param {string} refLangName - The name of the reference language.
 * @param {string} compLangName - The name of the language being checked.
 * @param {string} currentPath - The current key path for recursion.
 */
function findMissingKeys(refObj, compObj, refLangName, compLangName, currentPath = '') {
    for (const key in refObj) {
        if (Object.prototype.hasOwnProperty.call(refObj, key)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (compObj[key] === undefined) {
                console.warn(`WARNUNG: Fehlender Schlüssel '${newPath}' in der ${compLangName.toUpperCase()} Übersetzung (gefunden in ${refLangName.toUpperCase()}).`);
            } else if (typeof refObj[key] === 'object' && refObj[key] !== null && typeof compObj[key] === 'object' && compObj[key] !== null && !Array.isArray(refObj[key])) {
                findMissingKeys(refObj[key], compObj[key], refLangName, compLangName, newPath);
            }
        }
    }
}

// --- Main Execution ---

console.log('Starting translation audit...');

const translations = {};
languages.forEach(lang => {
    translations[lang] = loadLanguageTranslations(lang);
});

const refTranslations = translations[referenceLanguage];
const otherLanguages = languages.filter(l => l !== referenceLanguage);

otherLanguages.forEach(lang => {
    const compTranslations = translations[lang];
    
    console.log(`\n--- Comparing ${referenceLanguage.toUpperCase()} (reference) against ${lang.toUpperCase()} ---`);
    findMissingKeys(refTranslations, compTranslations, referenceLanguage, lang);
    
    console.log(`\n--- Comparing ${lang.toUpperCase()} against ${referenceLanguage.toUpperCase()} (reference) ---`);
    findMissingKeys(compTranslations, refTranslations, lang, referenceLanguage);
});

console.log('\nTranslation audit finished.');
