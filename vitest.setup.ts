import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest'
import { i18nPromise } from './i18n'

beforeAll(async () => {
	await i18nPromise
})
