import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Input } from '@/components/ui/ThemePrimitives';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ className, value, onClear, ...props }, ref) => {
    const { t } = useTranslation();
    return (
        <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <PhosphorIcons.MagnifyingGlass className="h-5 w-5 text-slate-400" />
            </span>
            <Input
                ref={ref as any}
                type="search"
                className={`pl-10 ${value && onClear ? 'pr-10' : ''} ${className || ''}`}
                value={value}
                {...props}
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={t('strainsView.clearSearch')}
                >
                    <PhosphorIcons.XCircle className="h-5 w-5 text-slate-400 hover:text-slate-200" />
                </button>
            )}
        </div>
    );
});
