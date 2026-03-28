import { setupServer } from 'msw/node'
import { geminiMockHandlers } from './geminiMock'

export const server = setupServer(...geminiMockHandlers)
