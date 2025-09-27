import { useSyncExternalStore } from 'react';
import { i18nInstance } from '@/i18n';

/**
 * A custom hook that subscribes to the i18next instance and
 * re-renders the component when the language changes.
 * This ensures the UI is always up-to-date with the selected language.
 *
 * @returns An object with the translation function `t` and the current `locale`.
 */
export const useTranslations = () => {
    const lng = useSyncExternalStore(
        (callback) => {
            i18nInstance.on('languageChanged', callback);
            return () => {
                i18nInstance.off('languageChanged', callback);
            };
        },
        () => i18nInstance.language
    );

    return {
        t: i18nInstance.t,
        locale: lng,
        i18n: i18nInstance
    };
};
