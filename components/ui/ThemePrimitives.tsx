import React, { forwardRef, memo, useId } from 'react';
import { PhosphorIcons } from '../icons/PhosphorIcons';

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

// FIX: Redefined props to use a discriminated union for type-safe polymorphic behavior,
// correctly handling attributes for both <input> and <textarea>.
type InputProps = 
    ({ as?: 'input' } & React.InputHTMLAttributes<HTMLInputElement>) |
    ({ as: 'textarea' } & React.TextareaHTMLAttributes<HTMLTextAreaElement>);


export const Input = memo(forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({ as = 'input', className, ...props }, ref) => {
    const commonClassName = `w-full input-base ${className}`;

    if (as === 'textarea') {
        return (
            <textarea
                {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                ref={ref as React.Ref<HTMLTextAreaElement>}
                className={commonClassName}
            />
        );
    }

    return (
        <input
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            ref={ref as React.Ref<HTMLInputElement>}
            className={commonClassName}
        />
    );
}));

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[];
};

export const Select = memo(forwardRef<HTMLSelectElement, SelectProps>(({ options, className, ...props }, ref) => {
    return (
        <select {...props} ref={ref} className={`w-full select-input ${className}`}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    );
}));

// --- LAYOUT ---

export const FormSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = memo(({ title, children, defaultOpen = false }) => (
    <details open={defaultOpen} className="group">
        <summary className="text-lg font-semibold text-primary-400 cursor-pointer mb-3 list-none flex items-center gap-2">
            <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-90" />
            {title}
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-4 border-l-2 border-slate-700 pl-5">
            {children}
        </div>
    </details>
));