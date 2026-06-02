import { WorkerBusError, WorkerErrorCode } from '@/types/workerBus.types'
import { PORT_TRANSFER_TYPE } from '@/services/worker-bus/workerBusConstants'

const channelKey = (a: string, b: string): string => (a < b ? `${a}::${b}` : `${b}::${a}`)

export class WorkerChannelRegistry {
    private readonly channels = new Map<string, MessageChannel>()

    createChannel(workerA: string, workerB: string, wA: Worker, wB: Worker): void {
        if (workerA === workerB) {
            throw new WorkerBusError(
                'Cannot create a channel between a worker and itself',
                WorkerErrorCode.INVALID_PAYLOAD,
                workerA,
            )
        }

        const key = channelKey(workerA, workerB)
        if (this.channels.has(key)) {
            throw new WorkerBusError(
                `Channel already exists between "${workerA}" and "${workerB}"`,
                WorkerErrorCode.INVALID_PAYLOAD,
                workerA,
            )
        }

        const channel = new MessageChannel()
        this.channels.set(key, channel)

        wA.postMessage({ type: PORT_TRANSFER_TYPE, peer: workerB, messageId: `channel:${key}` }, [
            channel.port1,
        ])
        wB.postMessage({ type: PORT_TRANSFER_TYPE, peer: workerA, messageId: `channel:${key}` }, [
            channel.port2,
        ])
    }

    closeChannel(workerA: string, workerB: string): void {
        const key = channelKey(workerA, workerB)
        const channel = this.channels.get(key)
        if (!channel) return
        channel.port1.close()
        channel.port2.close()
        this.channels.delete(key)
    }

    hasChannel(workerA: string, workerB: string): boolean {
        return this.channels.has(channelKey(workerA, workerB))
    }

    getChannels(): Array<[string, string]> {
        return [...this.channels.keys()].map((key) => {
            const parts = key.split('::')
            return [parts[0] ?? '', parts[1] ?? ''] as [string, string]
        })
    }

    closeChannelsForWorker(workerName: string): void {
        for (const [key, channel] of this.channels) {
            if (key.startsWith(`${workerName}::`) || key.endsWith(`::${workerName}`)) {
                channel.port1.close()
                channel.port2.close()
                this.channels.delete(key)
            }
        }
    }

    dispose(): void {
        for (const [key, channel] of this.channels) {
            channel.port1.close()
            channel.port2.close()
            this.channels.delete(key)
        }
    }
}
