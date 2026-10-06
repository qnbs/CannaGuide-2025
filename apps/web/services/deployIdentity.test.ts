import { describe, expect, it } from 'vitest'
import { deployVersionFromPayload } from './deployIdentity'

const SHA = '40c2d9020cc8d01f8df0a4f6ecf6629d501c0eef'

describe('deployVersionFromPayload', () => {
    it('accepts a stamped continuous-web version', () => {
        expect(deployVersionFromPayload({ buildVersion: `1.9.0+${SHA}` }, '1.9.0')).toBe(
            `1.9.0+${SHA}`,
        )
    })

    it('rejects a semantic version, a short sha, and a non-object', () => {
        expect(deployVersionFromPayload({ buildVersion: '1.9.0' }, '1.9.0')).toBe('1.9.0')
        expect(deployVersionFromPayload({ buildVersion: '1.9.0+40c2d902' }, '1.9.0')).toBe('1.9.0')
        expect(deployVersionFromPayload(null, '1.9.0')).toBe('1.9.0')
    })
})
