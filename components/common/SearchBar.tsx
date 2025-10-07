import React, { forwardRef } from 'react';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Input } from '@/components/ui/ThemePrimitives';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // value, onChange, placeholder, etc., are included in the extension
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ className, ...props }, ref) => {
    return (
        <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <PhosphorIcons.MagnifyingGlass className="h-5 w-5 text-slate-400" />
            </span>
            <Input
                ref={ref as any}
                type="search"
                className={`pl-10 ${className || ''}`}
                {...props}
            />
        </div>
    );
});