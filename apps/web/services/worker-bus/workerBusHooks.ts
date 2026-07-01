import type { DispatchCompleteEvent } from '@/services/worker-bus/workerBusTypes'

export function fireDispatchHooks(
    hooks: Array<(event: DispatchCompleteEvent) => void>,
    event: DispatchCompleteEvent,
): void {
    for (const hook of hooks) {
        try {
            hook(event)
        } catch (err) {
            console.debug('[WorkerBus] onDispatchComplete hook threw:', err)
        }
    }
}
