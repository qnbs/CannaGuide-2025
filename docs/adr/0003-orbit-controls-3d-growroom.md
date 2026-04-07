# ADR-0003: Three.js OrbitControls for 3D GrowRoom

**Date:** 2026-04-02
**Status:** Accepted
**Deciders:** Core team

## Context

`GrowRoom3D.tsx` rendered a static Three.js scene with a fixed camera orbit. Users could not inspect plants from different angles. Additionally, there was no visual connection between the 3D view and live IoT sensor data.

## Decision

Add `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js` with damping (0.08), restricted zoom (2-10 distance), no pan, and max polar angle to prevent flipping. The camera auto-orbits by default and stops when the user interacts (via `start` event listener on controls). An IoT live sensor badge overlay shows real-time temperature and humidity from `sensorStore` using `useSyncExternalStore`.

A custom TypeScript module declaration in `types/three.d.ts` provides type safety for OrbitControls since the examples directory has no bundled types.

**Update (2026-04-07):** Custom `types/three.d.ts` replaced by `@types/three` (DefinitelyTyped). All Three.js classes now have full type safety instead of `any` stubs.

## Consequences

### Positive

- Users can freely inspect the 3D grow room from any angle
- Auto-orbit provides engaging default behavior for passive viewing
- IoT badge bridges the gap between 3D visualization and live sensor data

### Negative

- Additional ~15KB for OrbitControls (already tree-shaken from Three.js bundle)
- Custom `.d.ts` declaration must be maintained if Three.js OrbitControls API changes -- **Resolved:** Replaced by `@types/three` which is maintained by DefinitelyTyped and auto-updated with Three.js releases

### Neutral

- No dependency on React Three Fiber (R3F) -- vanilla Three.js approach maintained for simplicity
