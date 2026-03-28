import React, { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Input } from '@/components/ui/input'

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
    ({ className, value, onClear, ...props }, ref) => {
        const { t } = useTranslation()
        const hasClearButton = Boolean(value && onClear)
        const inputClassName = `pl-10 ${hasClearButton ? 'pr-10' : ''} ${className || ''}`
        const computedAriaLabel =
            props['aria-label'] ??
            (typeof props.placeholder === 'string' ? props.placeholder : undefined) ??
            t('common.search')
        return (
            <div className="relative w-full" role="search">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <PhosphorIcons.MagnifyingGlass
                        className="h-5 w-5 text-slate-400"
                        aria-hidden="true"
                    />
                </span>
                <Input
                    ref={ref}
                    type="search"
                    className={inputClassName}
                    value={value}
                    aria-label={computedAriaLabel}
                    {...props}
                />
                {hasClearButton && (
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
        )
    },
)
