/** Cryptographically secure random float in [0, 1) — drop-in replacement for Math.random(). */
export function secureRandom(): number {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)

    return array[0]! / 0x1_0000_0000
}
