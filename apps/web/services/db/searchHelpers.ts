export const isPlainObjectRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

export const intersectResultSets = (resultSets: Set<string>[]): Set<string> => {
    if (resultSets.length === 0) {
        return new Set()
    }

    const [firstSet, ...otherSets] = resultSets
    return otherSets.reduce(
        (left, right) => new Set([...left].filter((id) => right.has(id))),
        new Set(firstSet),
    )
}

export const collectIdsForToken = (
    store: IDBObjectStore,
    token: string,
    onComplete: (idsForToken: Set<string>) => void,
): void => {
    const range = IDBKeyRange.bound(token, token + '\uffff')
    const request = store.openCursor(range)
    const idsForToken = new Set<string>()

    request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const value = cursor.value as { ids?: unknown }
            if (Array.isArray(value.ids)) {
                value.ids.forEach((id) => {
                    if (typeof id === 'string') {
                        idsForToken.add(id)
                    }
                })
            }
            cursor.continue()
            return
        }

        onComplete(idsForToken)
    }

    request.onerror = () => {
        console.debug(`[dbService] Search index request failed for token: ${token}`)
        onComplete(new Set())
    }
}
