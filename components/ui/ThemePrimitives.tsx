import React, { forwardRef, memo, useId, useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useOutsideClick } from '@/hooks/useOutsideClick';

// --- TYPOGRAPHY ---

type TitleOwnProps<E extends React.ElementType> = {
    children?: React.ReactNode;
    className?: string;
    as?: E;
};

type TitleProps<E extends React.ElementType> = TitleOwnProps<E> &
    Omit<React.ComponentProps<E>, keyof TitleOwnProps<E>>;

const defaultTitleElement = 'h2';

const TitleComponent = <E extends React.ElementType = typeof defaultTitleElement>({
    children,
    className,
    as,
    ...props
}: TitleProps<E>) => {
    const Component: any = as || defaultTitleElement;
    return (
        <Component className={`font-bold font-display text-primary-300 ${className}`} {...props}>
            {children}
        </Component>
    );
};
export const Title = memo(TitleComponent);

type ParagraphOwnProps<E extends React.ElementType> = {
    children?: React.ReactNode;
    className?: string;
    as?: E;
};

type ParagraphProps<E extends React.ElementType> = ParagraphOwnProps<E> &
    Omit<React.ComponentProps<E>, keyof ParagraphOwnProps<E>>;

const defaultParagraphElement = 'p';

const ParagraphComponent = <E extends React.ElementType = typeof defaultParagraphElement>({
    children,
    className,
    as,
    ...props
}: ParagraphProps<E>) => {
    const Component: any = as || defaultParagraphElement;
    return (
        <Component className={`text-slate-300 ${className}`} {...props}>
            {children}
        </Component>
    );
};
export const Paragraph = memo(ParagraphComponent);


// --- FORM ELEMENTS ---

type InputProps =
    | ({ as?: 'input' } & React.InputHTMLAttributes<HTMLInputElement> & { label?: string })
    | ({ as: 'textarea' } & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string });


export const Input = memo(
    forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
        ({ as = 'input', className, label, ...props }, ref) => {
            const id = useId();
            const commonClassName = `w-full bg-slate-800 ring-1 ring-inset ring-white/20 rounded-md px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200 ${className || ''}`;

            const inputElement =
                as === 'textarea' ? (
                    <textarea
                        id={id}
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        className={commonClassName}
                    />
                ) : (
                    <input
                        id={id}
                        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                        ref={ref as React.Ref<HTMLInputElement>}
                        className={commonClassName}
                    />
                );
            
            if (label) {
                return (
                    <div>
                        <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
                        {inputElement}
                    </div>
                )
            }

            return inputElement;
        }
    )
);

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
    options: { value: string | number; label: string }[];
    value?: string | number;
    onChange?: (e: { target: { value: string | number } }) => void;
    label?: string;
};

export const Select = memo(
    forwardRef<HTMLButtonElement, SelectProps>(({ options, className, value, onChange, label, ...props }, ref) => {
        const id = useId();
        const [isOpen, setIsOpen] = useState(false);
        const [isAbove, setIsAbove] = useState(false);
        const [highlightedIndex, setHighlightedIndex] = useState(0);
        const containerRef = useOutsideClick<HTMLDivElement>(() => setIsOpen(false));
        const listRef = useRef<HTMLUListElement>(null);
        const buttonRef = useRef<HTMLButtonElement | null>(null);

        const setButtonRef = useCallback((element: HTMLButtonElement | null) => {
            buttonRef.current = element;
            if (typeof ref === 'function') {
                ref(element);
            } else if (ref) {
                ref.current = element;
            }
        }, [ref]);

        const selectedOption = options.find(opt => opt.value === value) || options[0] || { label: 'Select...', value: '' };

        useEffect(() => {
            if (isOpen) {
                const selectedIdx = options.findIndex(opt => opt.value === value);
                setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
            }
        }, [isOpen, value, options]);

        useEffect(() => {
            if (isOpen && listRef.current) {
                const highlightedElement = listRef.current.children[highlightedIndex] as HTMLLIElement;
                highlightedElement?.scrollIntoView({ block: 'nearest' });
            }
        }, [isOpen, highlightedIndex]);

        useLayoutEffect(() => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownHeight = 240; // Corresponds to max-h-60
                const spaceAbove = rect.top;
                setIsAbove(spaceBelow < dropdownHeight && spaceAbove > dropdownHeight);
            }
        }, [isOpen]);


        const handleSelect = (optionValue: string | number) => {
            if (props.disabled || !onChange) return;
            onChange({ target: { value: optionValue } });
            setIsOpen(false);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (props.disabled) return;
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (isOpen) {
                        handleSelect(options[highlightedIndex].value);
                    } else {
                        setIsOpen(true);
                    }
                    break;
                case 'ArrowUp':
                case 'ArrowDown': {
                    e.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                        break;
                    }
                    const newIndex = highlightedIndex + (e.key === 'ArrowDown' ? 1 : -1);
                    if (newIndex >= 0 && newIndex < options.length) {
                        setHighlightedIndex(newIndex);
                    }
                    break;
                }
                case 'Escape':
                    setIsOpen(false);
                    break;
                 case 'Home':
                    e.preventDefault();
                    setHighlightedIndex(0);
                    break;
                case 'End':
                    e.preventDefault();
                    setHighlightedIndex(options.length - 1);
                    break;
            }
        };
        
        return (
            <div>
                {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>}
                <div ref={containerRef} className="relative">
                    <button
                        ref={setButtonRef}
                        id={id}
                        type="button"
                        className={`w-full bg-slate-800 ring-1 ring-inset ring-white/20 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 text-left flex justify-between items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
                        onClick={() => !props.disabled && setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        disabled={props.disabled}
                    >
                        <span className="truncate">{selectedOption.label}</span>
                        <PhosphorIcons.ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && !props.disabled && (
                        <ul
                            ref={listRef}
                            className={`absolute z-30 w-full bg-slate-800 border border-primary-900 rounded-md shadow-lg max-h-60 overflow-y-auto p-1 ${isAbove ? 'bottom-full mb-1 animate-fade-in-up' : 'mt-1 animate-slide-down-fade-in'}`}
                            role="listbox"
                        >
                            {options.map((opt, index) => (
                                <li
                                    key={opt.value}
                                    className={`px-3 py-2 text-sm text-slate-200 rounded-md cursor-pointer ${highlightedIndex === index ? 'bg-primary-600 text-white' : 'hover:bg-slate-700'}`}
                                    onClick={() => handleSelect(opt.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    role="option"
                                    aria-selected={value === opt.value}
                                >
                                    {opt.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    })
);


// --- LAYOUT ---

export const FormSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: React.ReactNode;
}> = memo(({ title, children, defaultOpen = false, icon }) => (
    <details open={defaultOpen} className='group bg-slate-800/30 rounded-xl p-4 ring-1 ring-inset ring-white/20'>
        <summary className='text-lg font-semibold text-primary-400 cursor-pointer mb-3 list-none flex justify-between items-center'>
            <div className="flex items-center gap-2">
                {icon}
                {title}
            </div>
            <PhosphorIcons.ChevronDown className='w-5 h-5 transition-transform duration-200 group-open:rotate-180' />
        </summary>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-700/50 pt-4'>
            {children}
        </div>
    </details>
));