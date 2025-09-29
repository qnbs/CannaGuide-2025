import React, { useState, useCallback } from 'react';

type ValidationErrors<T> = {
    [K in keyof T]?: string;
};

type ValidationFunction<T> = (values: T) => ValidationErrors<T>;

interface UseFormProps<T> {
    initialValues: T;
    validate: ValidationFunction<T>;
    onSubmit: (values: T) => void;
}

export const useForm = <T extends Record<string, any>>({
    initialValues,
    validate,
    onSubmit,
}: UseFormProps<T>) => {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<ValidationErrors<T>>({});

    const handleChange = useCallback((field: keyof T, value: T[keyof T]) => {
        setValues(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            onSubmit(values);
        }
    }, [values, validate, onSubmit]);

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
    };
};