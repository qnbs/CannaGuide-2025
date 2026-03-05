import { getT } from '@/i18n'

export const getDynamicLoadingMessages = ({
    useCase,
    data,
}: {
    useCase: string
    data?: Record<string, unknown>
}): string[] => {
    const t = getT()
    const messagesResult = t(`ai.loading.${useCase}`, {
        ...data,
        returnObjects: true,
    })

    if (
        typeof messagesResult === 'object' &&
        messagesResult !== null &&
        !Array.isArray(messagesResult)
    ) {
        return Object.values(messagesResult).map(String)
    }

    if (Array.isArray(messagesResult)) {
        return messagesResult.map(String)
    }

    return [String(messagesResult)]
}