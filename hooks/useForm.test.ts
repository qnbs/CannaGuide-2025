import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from './useForm'

const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

describe('useForm', () => {
    it('initializes with given values', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: 'TestPlant', days: 0 },
                validate: () => ({}),
                onSubmit: vi.fn(),
            }),
        )
        expect(result.current.values.name).toBe('TestPlant')
        expect(result.current.values.days).toBe(0)
    })

    it('updates values via handleChange', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: '' },
                validate: () => ({}),
                onSubmit: vi.fn(),
            }),
        )
        act(() => {
            result.current.handleChange('name', 'NewName')
        })
        expect(result.current.values.name).toBe('NewName')
    })

    it('resets to initial values', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: 'Init' },
                validate: () => ({}),
                onSubmit: vi.fn(),
            }),
        )
        act(() => {
            result.current.handleChange('name', 'Changed')
        })
        expect(result.current.values.name).toBe('Changed')

        act(() => {
            result.current.resetForm()
        })
        expect(result.current.values.name).toBe('Init')
    })

    it('calls onSubmit when validation passes', () => {
        const onSubmit = vi.fn()
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: 'OK' },
                validate: () => ({}),
                onSubmit,
            }),
        )
        act(() => {
            result.current.handleSubmit(fakeEvent)
        })
        expect(onSubmit).toHaveBeenCalledWith({ name: 'OK' })
    })

    it('does not call onSubmit when validation fails', () => {
        const onSubmit = vi.fn()
        const validate = vi.fn(() => ({ name: 'required' }))
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: '' },
                validate,
                onSubmit,
            }),
        )
        act(() => {
            result.current.handleSubmit(fakeEvent)
        })
        expect(onSubmit).not.toHaveBeenCalled()
        expect(result.current.errors.name).toBe('required')
    })

    it('clears errors after resubmit with valid data', () => {
        const validate = vi.fn((vals: { name: string }) =>
            vals.name === '' ? { name: 'required' } : {},
        )
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: '' },
                validate,
                onSubmit: vi.fn(),
            }),
        )
        act(() => {
            result.current.handleSubmit(fakeEvent)
        })
        expect(result.current.errors.name).toBe('required')

        act(() => {
            result.current.handleChange('name', 'fixed')
        })
        act(() => {
            result.current.handleSubmit(fakeEvent)
        })
        expect(result.current.errors.name).toBeUndefined()
    })
})
