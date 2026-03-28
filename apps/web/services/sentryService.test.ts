import { describe, expect, it } from 'vitest'

import { Sentry, captureLocalAiError, disableSentry, enableSentry } from '@/services/sentryService'

describe('sentryService', () => {
	it('exposes safe no-op capture proxies', () => {
		expect(() => Sentry.captureException(new Error('x'))).not.toThrow()
		expect(() => Sentry.captureMessage('msg')).not.toThrow()
	})

	it('supports disable/enable lifecycle without throwing', async () => {
		expect(() => disableSentry()).not.toThrow()
		expect(() => Sentry.captureMessage('disabled-msg')).not.toThrow()

		expect(() => enableSentry()).not.toThrow()
		await expect(Sentry.ready).resolves.toBeUndefined()
	})

	it('captures local-ai errors through safe proxy', () => {
		expect(() =>
			captureLocalAiError(new Error('local-ai-failure'), {
				stage: 'inference',
				model: 'test-model',
				backend: 'webgpu',
				retryAttempt: 1,
			}),
		).not.toThrow()
	})
})
