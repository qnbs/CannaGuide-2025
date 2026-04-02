# ADR-0002: IoT Dashboard as Equipment View Tab

**Date:** 2026-04-02
**Status:** Accepted
**Deciders:** Core team

## Context

IoT sensor data (temperature, humidity, VPD, CO2, light, pH, EC) was only accessible through the Settings IoT configuration tab. Growers needed a real-time monitoring dashboard with visual indicators (sparklines, gauges, connection status) without navigating away from their grow management workflow.

## Decision

Add `IotDashboardView.tsx` as a new tab within the Equipment view (via `EquipmentViewTab.IotDashboard` enum value). The dashboard subscribes to the existing vanilla Zustand `sensorStore` using `useSyncExternalStore` for real-time updates. Sparkline SVG charts render the last 20 readings. Gauge cards show optimal range color coding. A telemetry panel displays MQTT message rates, validation rates, latency, and error counts.

## Consequences

### Positive

- Real-time sensor monitoring without leaving the grow management context
- Reuses existing `sensorStore` and `useIotStore` -- no new state architecture
- Lazy-loaded via `React.lazy()` so non-IoT users pay no bundle cost

### Negative

- Equipment view now has 7 tabs, increasing navigation complexity
- Sparkline SVG rendering on every sensor update may need throttling at high data rates

### Neutral

- IoT Settings tab remains separate for device configuration (no duplication)
