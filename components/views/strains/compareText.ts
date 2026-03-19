const collator = new Intl.Collator(undefined, {
    sensitivity: 'base',
    numeric: true,
})

export const compareText = (left: unknown, right: unknown): number => {
    return collator.compare(String(left ?? ''), String(right ?? ''))
}