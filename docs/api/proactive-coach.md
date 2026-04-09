# Proactive Smart Coach API Reference

> Automated environment monitoring with AI-powered plant-specific advice
> and browser push notifications.

**Source files:**

| Module        | Path                                                        |
| ------------- | ----------------------------------------------------------- |
| Coach Service | `apps/web/services/proactiveCoachService.ts`                |
| Alert Store   | `apps/web/stores/useAlertsStore.ts`                         |
| Alert Banner  | `apps/web/components/views/plants/ProactiveAlertBanner.tsx` |
| Notifications | `apps/web/services/nativeBridgeService.ts`                  |

---

## proactiveCoachService

Subscribes to the Redux store and monitors plant environment values
against safe thresholds. When a metric breaches limits, the service
requests plant-specific advice via `aiFacade.aiService.getPlantAdvice()`
and pushes a `SmartAlert` into `useAlertsStore`.

### Initialization

```typescript
proactiveCoachService.init(store: AppStore): void
proactiveCoachService.dispose(): void
```

Called in `index.tsx` after store hydration. `init()` subscribes to
Redux store changes. `dispose()` unsubscribes and clears internal timers.

### Monitoring Behavior

On each Redux state change the service:

1. Iterates all active plants and their environment readings
2. Resolves the effective threshold for each metric (stage-specific
   overrides take precedence over base thresholds)
3. Checks if any metric value falls outside the `[min, max]` range
4. Applies per-metric per-plant cooldown (2 hours) to prevent alert spam
5. For each new breach, calls `aiService.getPlantAdvice()` concurrently
   (max 2 in-flight calls)
6. Pushes the resulting `SmartAlert` into `useAlertsStore`
7. Dispatches a browser notification via `nativeBridgeService`

### Loop Protection

Internal loop detector (`LOOP_THRESHOLD = 50`, `LOOP_WINDOW_MS = 100 ms`)
prevents cascading store subscriptions from causing infinite cycles.
Triggered loops pause monitoring for `LOOP_COOLDOWN_MS = 5000 ms`.

---

## Thresholds

### Base Thresholds

| Metric        | Min | Max  | Unit    |
| ------------- | --- | ---- | ------- |
| `temperature` | 16  | 30   | Celsius |
| `humidity`    | 30  | 75   | %       |
| `vpd`         | 0.4 | 1.6  | kPa     |
| `ph`          | 5.5 | 7.0  | -       |
| `ec`          | 0.5 | 3.0  | mS/cm   |
| `co2`         | 300 | 1500 | ppm     |
| `moisture`    | 20  | 90   | %       |

### Stage-Specific Overrides

| Stage              | Metric      | Min | Max |
| ------------------ | ----------- | --- | --- |
| Seed / Germination | vpd         | 0.4 | 0.8 |
|                    | temperature | 20  | 28  |
|                    | humidity    | 60  | 80  |
| Seedling           | vpd         | 0.4 | 0.8 |
|                    | temperature | 20  | 28  |
|                    | humidity    | 60  | 75  |
| Vegetative         | vpd         | 0.8 | 1.2 |
|                    | temperature | 18  | 28  |
|                    | humidity    | 40  | 70  |
| Flowering          | vpd         | 1.0 | 1.6 |
|                    | temperature | 17  | 27  |
|                    | humidity    | 30  | 50  |

Stages without explicit overrides fall back to base thresholds.

---

## useAlertsStore

Zustand store for transient smart coach alerts. Not persisted to
IndexedDB -- alerts are session-scoped.

### Types

```typescript
type AlertMetric = 'temperature' | 'humidity' | 'vpd' | 'ph' | 'ec' | 'co2' | 'moisture'

interface SmartAlert {
    id: string
    timestamp: number
    triggerValue: number
    metric: AlertMetric
    aiAdvice: string
    isDismissed: boolean
    plantId: string
    plantName: string
    growId: string
    growName: string
}
```

### Actions

```typescript
addAlert(alert: SmartAlert): void    // Appends; caps at MAX_ALERTS (50)
dismissAlert(id: string): void       // Sets isDismissed = true
clearAlerts(): void                  // Removes all alerts
```

### Usage in Components

```typescript
import { useAlertsStore } from '@/stores/useAlertsStore'

const alerts = useAlertsStore((s) => s.alerts)
const dismiss = useAlertsStore((s) => s.dismissAlert)
```

`ProactiveAlertBanner.tsx` renders active (non-dismissed) alerts in
`DetailedPlantView` filtered to the current plant.

---

## Constants

| Constant               | Value                         | Description                           |
| ---------------------- | ----------------------------- | ------------------------------------- |
| `COOLDOWN_MS`          | 7,200,000 (2h)                | Per-metric per-plant cooldown         |
| `COOLDOWN_SESSION_KEY` | `'cannaguide_coach_cooldown'` | SessionStorage key for cooldown state |
| `MAX_CONCURRENT_CALLS` | 2                             | Max parallel AI advice requests       |
| `MAX_ALERTS`           | 50                            | Alert store cap (oldest dropped)      |
| `LOOP_THRESHOLD`       | 50                            | Loop detection: dispatches per window |
| `LOOP_WINDOW_MS`       | 100                           | Loop detection: window duration (ms)  |
| `LOOP_COOLDOWN_MS`     | 5000                          | Pause duration on loop detection      |
