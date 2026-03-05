import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('gemini mock (msw)', () => {
  it('returns mocked payload for Gemini endpoint', async () => {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: 'hello' }),
    })

    expect(res.ok).toBe(true)
    const data = (await res.json()) as { text?: string }
    expect(data.text).toBe('mocked gemini response')
  })
})
