# IoT Integration Roadmap -- CannaGuide 2025

<!-- markdownlint-disable MD024 MD040 MD029 MD013 -->

**Version:** 1.0.0
**Datum:** 2026-04-01
**Autor:** Deep-Dive-Audit (Sessions 11-14, 30.03.--01.04.2026)
**Status:** Living Document -- wird laufend aktualisiert

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Ist-Stand-Analyse](#2-ist-stand-analyse)
3. [Architektur und Datenfluss](#3-architektur-und-datenfluss)
4. [Staerken der aktuellen Implementierung](#4-staerken-der-aktuellen-implementierung)
5. [Kritische Schwaechen und Risiken](#5-kritische-schwaechen-und-risiken)
6. [Bewertungen nach Bereich](#6-bewertungen-nach-bereich)
7. [32-Punkte-Massnahmenkatalog](#7-32-punkte-massnahmenkatalog)
8. [ESP32 Hardware-Integration](#8-esp32-hardware-integration)
9. [ESPHome MQTT Templates](#9-esphome-mqtt-templates)
10. [MLX90614 IR-Sensor Leaf-Temp Integration](#10-mlx90614-ir-sensor-leaf-temp-integration)
11. [MQTT-Protokoll-Vertiefung](#11-mqtt-protokoll-vertiefung)
12. [Security-Hardening-Checkliste](#12-security-hardening-checkliste)
13. [Performance-Optimierung](#13-performance-optimierung)
14. [Timeline und Meilensteine](#14-timeline-und-meilensteine)
15. [Dateireferenzen](#15-dateireferenzen)

---

## 1. Executive Summary

Die IoT-Integration in CannaGuide 2025 ist seit dem 30.03.2026 aktiv und umfasst einen vollstaendigen
MQTT-over-WebSocket-Client, Web Bluetooth LE, einen AI-Proactive-Smart-Coach und
ESP32-Mocks. Die Integration ist 100% client-side, privacy-first und offline-faehig.

**Gesamtnote: 6.8 / 10** -- Technisch ambitioniert und nahtlos in die App eingebettet, aber noch
"Minimum Viable IoT". Es fehlt Robustheit, Protokoll-Tiefe, Hardware-Docs und echte Firmware-Templates.

Dieses Dokument definiert den vollstaendigen Weg von "Mock-only" zu einer produktionsreifen,
hardware-ready Smart-Grow-Telemetrie-Loesung.

---

## 2. Ist-Stand-Analyse

### 2.1 IoT-Services (5 Module, ~1020 LOC)

| Service         | Datei                                            | LOC | Funktion                                                                                              |
| --------------- | ------------------------------------------------ | --- | ----------------------------------------------------------------------------------------------------- |
| MQTT Client     | `apps/web/services/mqttClientService.ts`         | 262 | Singleton MQTT-Client, subscribt Topics, dispatcht Redux `addJournalEntry` mit `source: 'iot_sensor'` |
| MQTT Sensor     | `apps/web/services/mqttSensorService.ts`         | 563 | Callback-basierter Sensor-Mapper, fuettert `sensorStore` (Zustand), validiert Payloads inline         |
| Web Bluetooth   | `apps/web/services/webBluetoothSensorService.ts` | 94  | One-Shot BLE-Read via `navigator.bluetooth.requestDevice()`, ESP32 GATT Characteristics               |
| Proactive Coach | `apps/web/services/proactiveCoachService.ts`     | 329 | Threshold-Monitoring -> AI-Advice -> Alerts (2h Cooldown, max 2 concurrent AI calls)                  |

### 2.2 State Stores (2 Module, ~194 LOC)

| Store        | Datei                            | LOC | Persistenz                             | Funktion                                                 |
| ------------ | -------------------------------- | --- | -------------------------------------- | -------------------------------------------------------- |
| IoT Settings | `apps/web/stores/useIotStore.ts` | 138 | localStorage `cannaguide-iot-settings` | Broker-URL, Credentials, Topic-Prefix, Connection-Status |
| Sensor Data  | `apps/web/stores/sensorStore.ts` | 145 | Keine (transient)                      | Live-Readings, 120-Entry FIFO History, Connection-State  |

**Default-Konfiguration:**

- Broker: `wss://test.mosquitto.org:8081`
- Topic-Prefix: `cannaguide/sensors`
- DeviceId: `esp32`

### 2.3 UI-Komponenten (2 Module, ~405 LOC)

| Komponente   | Datei                                                         | LOC | Funktion                                               |
| ------------ | ------------------------------------------------------------- | --- | ------------------------------------------------------ |
| Sensor Panel | `apps/web/components/views/plants/SensorIntegrationPanel.tsx` | 190 | BLE/MQTT Toggle in Plant-Detail-View, Live-Readings    |
| IoT Settings | `apps/web/components/views/settings/IotSettingsTab.tsx`       | 215 | Broker-Config, Test-Connection, Status-Badge (pulsing) |

### 2.4 Mock-Infrastruktur

| Mock       | Datei                             | Port | Funktion                                                      |
| ---------- | --------------------------------- | ---- | ------------------------------------------------------------- |
| ESP32 Mock | `docker/esp32-mock/server.mjs`    | 3001 | HTTP-Sensor-Simulator mit Diurnal-Zyklus (18h Tag / 6h Nacht) |
| IoT Mocks  | `docker/iot-mocks/src/server.mjs` | 3001 | Erweiterte Kopie des ESP32-Mocks                              |

**ESP32-Mock-Details:**

- Tag-Zyklus: 25 C Basis, 55% RH (Lights-on)
- Nacht-Zyklus: 20 C Basis, 65% RH (22:00 Lights-off)
- Noise: +/-0.8 C, +/-2.0% RH
- Clamping: 15..35 C, 30..85% RH
- Endpoints: `GET /sensor` (JSON), `GET /health` (Status)
- Update-Intervall: 2s

### 2.5 MQTT Topic-Struktur (aktuell)

```
{topicPrefix}/{deviceId}/temperature   -> { value: number }
{topicPrefix}/{deviceId}/humidity      -> { value: number }
{topicPrefix}/{deviceId}/ph            -> { value: number }
{topicPrefix}/{deviceId}/env           -> { temperature, humidity, ph? }
```

### 2.6 Validierung (aktuell)

- **Keine Zod-Schemas** -- alle Validierung ist inline
- `sanitizePayload()` in mqttClientService: mindestens ein Sensor-Wert muss vorhanden sein
- `clampSensorValue()` in mqttSensorService: Typcheck + `Number.isFinite()` + Range-Pruefung
- Plausibilitaets-Ranges: temp -40..80 C, humidity 0..100%, pH 0..14
- Broker-URL: nur `ws://` oder `wss://` erlaubt
- Subtopic: `/^[a-zA-Z0-9_-]+$/` (verhindert Path-Traversal)
- Max Payload: 65536 Bytes

### 2.7 Testing

- E2E: `iot-sensor-simulation.e2e.ts` (Chromium-only) -- deckt ab:
    - Normale Sensor-Daten
    - ESP32 offline (Connection Refused)
    - Absurde Werte (999 C, -50% RH)
    - Malformed JSON
    - HTTP 500
    - Fehlende Felder
    - Intermittierender Paketverlust (~33%)
- Unit: `mqttSensorService.test.ts`

### 2.8 Proactive Coach Thresholds

| Metrik      | Min | Max | Einheit |
| ----------- | --- | --- | ------- |
| Temperature | 16  | 30  | C       |
| Humidity    | 30  | 75  | %       |
| VPD         | 0.4 | 1.6 | kPa     |
| pH          | 5.5 | 7.0 | pH      |
| EC          | 0.5 | 3.0 | dS/m    |

Alerts: Max 50 (FIFO), 2h Cooldown pro Metrik/Pflanze, max 2 parallele AI-Calls.

---

## 3. Architektur und Datenfluss

### 3.1 MQTT-Pfad (Primaer)

```
MQTT Broker (WebSocket wss://)
    |
    v
mqttSensorService.connect()
    |-- subscribt: {prefix}/{deviceId}/temperature
    |-- subscribt: {prefix}/{deviceId}/humidity
    |-- subscribt: {prefix}/{deviceId}/ph
    |-- subscribt: {prefix}/{deviceId}/env
    |
    v  (Message empfangen)
clampSensorValue() -- Inline-Validierung
    |
    +---> sensorStore.pushReading()     [Zustand, transient, ~500ms]
    |         |
    |         +---> UI: SensorIntegrationPanel (Live-Charts)
    |         +---> UI: EnvironmentDashboard (Digital Twin)
    |
    +---> mqttClientService.dispatch()  [Redux, persistent]
              |
              +---> addJournalEntry({ source: 'iot_sensor' })
              +---> setGlobalEnvironment()
```

### 3.2 BLE-Pfad (Sekundaer)

```
SensorIntegrationPanel "Connect BLE"
    |
    v
webBluetoothSensorService.readEsp32EnvironmentalSensor()
    |-- navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'ESP32' }] })
    |-- GATT Characteristics lesen
    |
    v
dispatch(setGlobalEnvironment())  [Redux, One-Shot]
```

### 3.3 AI Smart Coach Integration

```
Redux Store (plant environment state)
    |  (2s debounce)
    v
proactiveCoachService.checkThresholds()
    |-- Vergleich gegen THRESHOLDS Map
    |-- 2h Cooldown-Check pro Metrik/Pflanze
    |
    v  (Breach erkannt)
aiService.getPlantAdvice()  [max 2 concurrent]
    |
    v
useAlertsStore.addAlert({ metric, triggerValue, aiAdvice })
    +---> ProactiveAlertBanner (UI)
    +---> nativeBridgeService (Push Notification)
```

---

## 4. Staerken der aktuellen Implementierung

1. **100% client-side und offline-faehig** -- kein Backend, keine Cloud-Pflicht, maximale DSGVO-Privacy
2. **Nahtlose Integration** in bestehende Kern-Features (Digital Twin, VPD, AI-Coach, Journal)
3. **Zwei Sensor-Pfade** (MQTT, BLE) -- maximale Hardware-Flexibilitaet
4. **Mock-Infrastruktur** bereits produktiv und CI-integriert
5. **Proactive Smart Coach** mit AI-basierter Beratung bei Threshold-Breaches
6. **Robuste Inline-Validierung** (Clamping, Payload-Size, URL/Subtopic-Checks)
7. **E2E-Testabdeckung** fuer Edge Cases (Offline, Absurde Werte, Paketverlust)
8. **Saubere Architektur-Trennung** (Zustand fuer High-Frequency, Redux fuer Persistenz)
9. **Zukunftssicher** -- passt zur Roadmap (v1.3 Additional IoT, v2.0 Digital Twin Architecture)
10. **Schnelle Einfuehrung** -- von 0 auf voll funktionsfaehig in 48h (Solo-Dev)

---

## 5. Kritische Schwaechen und Risiken

### 5.1 Protokoll und Stabilitaet

- **Kein exponentieller Backoff** bei Reconnect-Versuchen
- **Kein auto-reSubscribe** nach Reconnect
- **Kein MQTT 5.0** (keine Topic Aliases, keine Enhanced Auth, keine User Properties)
- **Keine QoS-Konfiguration** (alles default QoS 0)
- **Keine Retained Messages** (kein Instant-State beim Connect)
- **Kein Last Will and Testament** (kein Offline-Signal an andere Clients)
- **Kein Clean Session Management** (keine offline Message Queue auf Broker-Seite)

### 5.2 Browser-Limitierungen

- WebSocket bricht bei Tab-Wechsel/Sleep/DOZE (Mobile) ab
- Hoher Batterieverbrauch bei permanentem Keep-Alive
- Kein nativer Bluetooth/Zigbee/WiFi-Direct (nur via Web APIs moeglich)
- Service Worker kann WS-Connections nicht aufrechterhalten

### 5.3 Security

- **Broker-Credentials unverschluesselt** in localStorage (App nutzt AES-256-GCM fuer API-Keys, aber nicht fuer IoT-Credentials)
- **Kein WSS-Enforcement** -- ws:// wird akzeptiert (Credentials im Klartext)
- **Kein PIN/Biometrie-Lock** fuer Gateway-Settings
- **Kein Payload-Signing** (Authentizitaet nicht verifizierbar)
- **Kein Topic-Namespace mit User-Prefix** (Cross-Talk bei geteiltem Broker moeglich)

### 5.4 Performance

- **MQTT-Processing auf Main-Thread** (kein Web Worker)
- **Kein Throttling/Batching** von Telemetry-Updates (jede Message triggert Re-Render)
- **MQTT-Client nicht lazy-loaded** (immer im Bundle auch wenn Gateway deaktiviert)
- **Keine Offline-Queue** fuer outgoing Messages bei Disconnect

### 5.5 Hardware und Docs

- **Keine Firmware-Templates** (kein ESPHome, kein Tasmota, kein Arduino Sketch)
- **Keine dokumentierten MQTT-Topics/JSON-Schemas** fuer Hardware-Partner
- **Mock-Server nur HTTP** (kein echtes MQTT-Publishing im Mock)
- **Kein Setup-Guide** fuer echte ESP32/Tasmota/Sonoff Hardware
- **i18n der IoT-UI** moeglicherweise unvollstaendig

### 5.6 Organisatorisch

- **Bus-Faktor 1** -- Solo-Dev, keine PR-Reviews fuer Protokoll-Aenderungen
- **Sehr jung** -- erst 2 Tage alt, kein Production-Hardening
- **Keine Metriken** (Telemetry-Latenz, Connection-Uptime, Payload-Errors)

---

## 6. Bewertungen nach Bereich

| Bereich                        | Note   | Kommentar                                           |
| ------------------------------ | ------ | --------------------------------------------------- |
| IoT-Gesamtmodul                | 6.8/10 | Ambitioniert, nahtlos integriert, aber MVP-Status   |
| MQTT-Implementierung           | 7.4/10 | Solides Fundament, fehlende Protokoll-Tiefe         |
| ESP32-Hardware-Readiness       | 5.9/10 | Nur Mock, kein Plug & Grow                          |
| ESPHome-Readiness              | 4.2/10 | Nicht vorhanden, hohes Potenzial                    |
| Security (IoT-spezifisch)      | 5.5/10 | Inline-Validierung okay, Credentials unsicher       |
| Performance (IoT-spezifisch)   | 6.0/10 | Main-Thread-Processing, kein Batching               |
| Testing (IoT-spezifisch)       | 7.5/10 | Gute E2E-Abdeckung, fehlt Mutation-Testing          |
| Dokumentation (IoT-spezifisch) | 4.0/10 | Keine User-Docs, keine Hardware-Guides              |
| AI-Coach-Integration           | 8.5/10 | Hervorragend -- Threshold + AI-Advice + Native Push |

---

## 7. 32-Punkte-Massnahmenkatalog

**Prioritaeten:** H = sofort (1-3 Tage), M = 1 Woche, L = langfristig

### A. Sofort-Fehlerbehebung und Stabilitaet (H)

| #   | Massnahme                                                                      | Prioritaet | Begruendung                                               |
| --- | ------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------- |
| 1   | **MQTT Reconnect mit exponential Backoff** + ping/pong + auto-reSubscribe      | H          | Grow-Netze sind instabil, WS bricht bei Sleep ab          |
| 2   | **Error-Boundary + Toast-Notifications** fuer Connection-Fails, Payload-Errors | H          | User muss sofort sehen wenn Sensor ausfaellt              |
| 3   | **Zod-Schema-Validation** fuer alle eingehenden Telemetry-Payloads             | H          | Inline-Validation ist fehleranfaellig und nicht typsicher |
| 4   | **WSS-Force + TLS-Only** mit Warnung bei ws:// im Gateway-UI                   | H          | Credentials werden sonst im Klartext uebertragen          |
| 5   | **CI-Stabilitaet**: IoT-Mock Node-Version pinnen + Healthcheck erweitern       | H          | Gestern CI-Fix noetig wegen Node-Inkompatibilitaet        |

### B. Security und Privacy (H-M)

| #   | Massnahme                                                                     | Prioritaet | Begruendung                                |
| --- | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------ |
| 6   | **Credentials verschluesseln** mit Web Crypto AES-256-GCM (wie cryptoService) | H          | localStorage ist XSS-angreifbar            |
| 7   | **PIN/Biometrie-Lock** fuer Gateway-Settings (Web Crypto)                     | M          | Grow-Daten sind sensibel                   |
| 8   | **Topic-Namespace** mit User-spezifischem Prefix                              | M          | Verhindert Cross-Talk bei geteiltem Broker |
| 9   | **Audit-Log** aller IoT-Connections (IndexedDB)                               | M          | Nachvollziehbarkeit bei Security-Incidents |

### C. Performance und Optimierung (M)

| #   | Massnahme                                                                      | Prioritaet | Begruendung                                  |
| --- | ------------------------------------------------------------------------------ | ---------- | -------------------------------------------- |
| 10  | **MQTT in dediziertem Web Worker** (Message-Processing ausserhalb Main-Thread) | M          | CPU-Entlastung bei hoher Message-Frequenz    |
| 11  | **Throttling / Batching** von Telemetry-Updates (max 1x/s Re-Render)           | M          | Verhindert UI-Stutter auf Low-End-Geraeten   |
| 12  | **Bundle-Splitting**: MQTT-Client + Charts nur lazy-loaden wenn Gateway aktiv  | M          | Reduziert Initial-Bundle-Size                |
| 13  | **Offline-Queue**: Outgoing Messages puffern und bei Reconnect senden          | M          | Commands gehen bei Disconnect nicht verloren |

### D. Feature-Erweiterungen und Perfektionierung (M-L)

| #   | Massnahme                                                                   | Prioritaet | Begruendung                                   |
| --- | --------------------------------------------------------------------------- | ---------- | --------------------------------------------- |
| 14  | **Multi-Broker / Multi-Gateway** Support (Zimmer 1 + Zimmer 2)              | M          | Real-World Grows haben mehrere Zonen          |
| 15  | **ESP32 / Tasmota / Sonoff Ready-Made Templates** (Topics + Firmware-Links) | M          | 90% der Grower brauchen Copy-Paste-Loesung    |
| 16  | **Bluetooth Low Energy (BLE)** via Web BLE API                              | L          | Batteriebetriebene Mini-Sensoren              |
| 17  | **VPD-Automation Rules Engine** ("Wenn VPD > 1.2 -> Ventilator via MQTT")   | L          | Echte Grow-Automation direkt aus der App      |
| 18  | **Export** von Telemetry als CSV/PDF + Dashboard-Charts                     | M          | Grower brauchen Reports fuer Optimierung      |
| 19  | **AR-Plant-Overlay** mit live Sensor-Overlay auf Kamera-Feed                | L          | Roadmap v2.0 Feature (Web Camera API + TF.js) |
| 20  | **Community IoT-Sharing** (anonymisierte Telemetry-Gists)                   | L          | Strain-spezifische Grow-Daten aggregieren     |

### E. UX/UI und Accessibility (M)

| #   | Massnahme                                                             | Prioritaet | Begruendung                                |
| --- | --------------------------------------------------------------------- | ---------- | ------------------------------------------ |
| 21  | **Live Status-Indicator** (gruen/gelb/rot + Latency) + Connection-Log | M          | Sofort-Feedback ueber Verbindungsqualitaet |
| 22  | **Drag-and-Drop Sensor Mapping** auf Digital-Twin                     | M          | Welcher Sensor gehoert zu welcher Pflanze  |
| 23  | **Dark-Mode optimierte Charts** + Colorblind-Sensor-Werte             | M          | WCAG 2.1 AA Compliance                     |
| 24  | **Onboarding-Wizard** "Erste IoT-Verbindung" mit Mock-Demo-Modus      | M          | Senkt Einstiegshuerde massiv               |

### F. Testing, Docs und DevEx (M)

| #   | Massnahme                                                                             | Prioritaet | Begruendung                           |
| --- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------- |
| 25  | **E2E-Tests** fuer vollen Flow: Gateway-Connect -> Telemetry -> AI-Alert -> Dashboard | M          | Kritischer Pfad muss abgesichert sein |
| 26  | **Mutation-Tests** fuer Connection-Store (Stryker)                                    | M          | Store-Logik ist sicherheitskritisch   |
| 27  | **Ausfuehrliche IoT-Docs** im Knowledge-Hub (Setup, Broker, Troubleshooting)          | M          | Aktuell keine User-Dokumentation      |
| 28  | **Docker-Mock erweitern**: Simulierte Sensor-Fehler, Latency, Disconnect              | M          | Realistische Testszenarien            |

### G. Langfristige Perfektionierung (L)

| #   | Massnahme                                                         | Prioritaet | Begruendung                      |
| --- | ----------------------------------------------------------------- | ---------- | -------------------------------- |
| 29  | ~~Native Tauri IoT-Plugins~~ (Removed)                            | --         | Tauri entfernt                   |
| 30  | **WebGPU-beschleunigte Telemetry-ML** (VPD-Prediction im Browser) | L          | Predictive statt reactive Alerts |
| 31  | **Federated IoT** (Community-Aggregate-Daten)                     | L          | "Community Grow Trends 2026"     |
| 32  | **Home Assistant Integration** via MQTT Auto-Discovery            | L          | Smart-Home-Oekosystem-Anbindung  |

---

## 8. ESP32 Hardware-Integration

### 8.1 Aktueller Stand

- **Nur Mock-basiert** -- kein einziger Zeile echten Firmware-Code im Repo
- ESP32-Mock (`docker/esp32-mock/server.mjs`) simuliert HTTP-Endpoints, kein echtes MQTT-Publishing (laeuft als Node.js-Server im DevContainer)
- Keine .ino, kein ESP-IDF, kein ESPHome-YAML, kein Tasmota-Template
- Keine Flashing-Guides oder Hardware-Empfehlungen

### 8.2 Ziel-Architektur (Plug & Grow)

```
ESP32 (BME680 + Soil + pH/EC + BH1750)
    |-- WiFi -> MQTT Broker (Mosquitto/HiveMQ)
    |                |
    |                +---> CannaGuide PWA (WebSocket Subscribe)
    |                +---> CannaGuide Desktop (Tauri native MQTT)
    |                +---> CannaGuide Mobile (Capacitor WS)
    |
    |-- BLE -> CannaGuide PWA (Web Bluetooth API)
    |-- USB -> CannaGuide Desktop (Tauri Serial)
```

### 8.3 Hardware-Empfehlungen

| Komponente    | Empfehlung         | Preis (ca.) | Funktion                                      |
| ------------- | ------------------ | ----------- | --------------------------------------------- |
| MCU           | ESP32-S3 DevKit    | 8-15 EUR    | WiFi + BLE 5.0 + USB-C                        |
| Temp/Hum/VPD  | BME680 / BME280    | 5-10 EUR    | Temperatur, Luftfeuchtigkeit, Druck, (Gas)    |
| Soil Moisture | Capacitive v1.2    | 2-5 EUR     | Bodenfeuchte (kapazitiv, korrosionsfrei)      |
| pH            | pH-Sonde + ADS1115 | 15-30 EUR   | pH-Wert via ADC                               |
| EC            | EC-Sonde + ADS1115 | 15-30 EUR   | Leitfaehigkeit via ADC                        |
| Licht (PAR)   | BH1750 / TSL2591   | 3-8 EUR     | Photosynthetisch aktive Strahlung             |
| CO2           | SCD40 / MH-Z19B    | 15-25 EUR   | CO2-Konzentration (ppm)                       |
| Leaf Temp     | MLX90614 (IR)      | 8-15 EUR    | Blattoberflaechen-Temperatur (beruehrungslos) |
| Batterie      | 18650 + TP4056     | 5-10 EUR    | Portabler Betrieb                             |

### 8.4 Firmware-Optionen

| Option                 | Schwierigkeit    | MQTT-Support | OTA     | Web-UI | Empfehlung                     |
| ---------------------- | ---------------- | ------------ | ------- | ------ | ------------------------------ |
| **ESPHome**            | Niedrig (YAML)   | Nativ        | Ja      | Ja     | **Beste Wahl fuer CannaGuide** |
| Tasmota                | Niedrig (Web-UI) | Nativ        | Ja      | Ja     | Gut fuer fertige Aktorik       |
| Arduino + PubSubClient | Mittel (C++)     | Manuell      | Manuell | Nein   | Maximale Kontrolle             |
| MicroPython + umqtt    | Mittel (Python)  | Manuell      | Manuell | Nein   | Fuer Python-Entwickler         |

### 8.5 Geplanter Repo-Ordner

```
firmware/
  esp32/
    esphome/
      basic-sensor.yaml        # Basis: BME280 + Soil
      vpd-pro.yaml             # Erweitert: BME680 + VPD-Berechnung + Leaf-Temp
      multi-zone.yaml          # Multi-Sensor + Relay-Aktorik
      secrets.yaml.example     # Broker-Credentials Vorlage
    tasmota/
      template.json            # Tasmota GPIO-Template
      rules.txt                # Tasmota Rules fuer MQTT-Topics
    arduino/
      cannaguide-sensor/
        cannaguide-sensor.ino  # Arduino Sketch mit PubSubClient
        config.h.example       # WiFi + MQTT Config
    docs/
      quickstart.md            # Flash-Anleitung (ESPHome Web Flasher)
      troubleshooting.md       # Haeufige Probleme
      hardware-bom.md          # Bill of Materials
```

---

## 9. ESPHome MQTT Templates

### 9.1 Topic-Schema (Ziel-Standard)

```
# Telemetry (ESP32 -> App)
cannaguide/plants/{plantId}/sensors/telemetry    -> JSON Payload (retained, QoS 1)

# Einzel-Sensoren (ESP32 -> App)
cannaguide/sensors/{deviceId}/temperature        -> { "value": number }
cannaguide/sensors/{deviceId}/humidity           -> { "value": number }
cannaguide/sensors/{deviceId}/ph                 -> { "value": number }
cannaguide/sensors/{deviceId}/env                -> { "temperature", "humidity", "ph"? }

# Commands (App -> ESP32)
cannaguide/plants/{plantId}/actuators/ventilator -> "on" | "off"
cannaguide/plants/{plantId}/actuators/light      -> 0-100 (dimmer)

# Status (ESP32 -> App)
cannaguide/status/{deviceId}                     -> "online" | "offline" (LWT)
```

### 9.2 JSON-Payload-Referenz (Zod-kompatibel)

```json
{
    "timestamp": "2026-04-01T12:00:00Z",
    "plantId": "plant-abc123",
    "deviceId": "esp32-zone1",
    "temp": 24.8,
    "humidity": 58,
    "vpd": 1.15,
    "leafTemp": 27.3,
    "ec": 1.7,
    "ph": 6.1,
    "co2": 430,
    "lightPar": 920,
    "soilMoisture": 42,
    "battery": 87
}
```

### 9.3 VPD-Pro ESPHome YAML (vpd-pro.yaml)

```yaml
substitutions:
    plant_id: 'plant-abc123'
    device_name: 'esp32-grow-zone1'

esphome:
    name: ${device_name}
    friendly_name: CannaGuide ESP32 VPD Zone 1

esp32:
    board: esp32dev

# Zeitquelle fuer Timestamps
time:
    - platform: sntp
      id: sntp_time
      timezone: Europe/Berlin

# WiFi-Konfiguration
wifi:
    ssid: !secret wifi_ssid
    password: !secret wifi_password
    ap:
        ssid: '${device_name}-fallback'

# MQTT-Konfiguration (exakt fuer CannaGuide-App)
mqtt:
    broker: !secret mqtt_broker
    username: !secret mqtt_user
    password: !secret mqtt_pass
    client_id: ${device_name}
    birth_message:
        topic: 'cannaguide/status/${device_name}'
        payload: 'online'
        qos: 1
        retain: true
    will_message:
        topic: 'cannaguide/status/${device_name}'
        payload: 'offline'
        qos: 1
        retain: true
    keepalive: 60s

# --- Sensoren ---

sensor:
    # BME680: Temperatur + Luftfeuchtigkeit + Druck
    - platform: bme680
      temperature:
          id: air_temp
          name: 'Air Temperature'
          unit_of_measurement: 'C'
          accuracy_decimals: 1
      humidity:
          id: air_humidity
          name: 'Air Humidity'
          unit_of_measurement: '%'
          accuracy_decimals: 0
      pressure:
          id: air_pressure
          name: 'Air Pressure'
          unit_of_measurement: 'hPa'
      address: 0x76
      update_interval: 10s

    # VPD-Berechnung (Tetens/Magnus-Formel, kPa)
    - platform: template
      id: vpd_sensor
      name: 'VPD'
      unit_of_measurement: 'kPa'
      accuracy_decimals: 2
      update_interval: 10s
      lambda: |-
          float t = id(air_temp).state;
          float rh = id(air_humidity).state;
          if (isnan(t) || isnan(rh)) return NAN;
          // Tetens/Magnus SVP-Formel (kPa)
          float svp = 0.61078f * expf(17.2694f * t / (t + 238.3f));
          // Leaf-Temp-Offset (+3 C Standard, anpassbar oder MLX90614 nutzen)
          float leaf_offset = 3.0f;
          float leaf_temp = t + leaf_offset;
          float leaf_svp = 0.61078f * expf(17.2694f * leaf_temp / (leaf_temp + 238.3f));
          // VPD = SVP_Leaf - (SVP_Air * RH/100)
          float vpd = leaf_svp - (svp * (rh / 100.0f));
          return (vpd < 0.0f) ? 0.0f : vpd;

    # Kapazitiver Bodenfeuchte-Sensor
    - platform: adc
      id: soil_moisture
      name: 'Soil Moisture'
      pin: GPIO34
      unit_of_measurement: '%'
      accuracy_decimals: 0
      update_interval: 30s
      filters:
          - calibrate_linear:
                - 2.8 -> 0
                - 1.2 -> 100

    # Batterie-Spannung
    - platform: adc
      id: battery_sensor
      name: 'Battery Voltage'
      pin: GPIO35
      unit_of_measurement: 'V'
      accuracy_decimals: 2
      update_interval: 60s

# --- Telemetry-Publish (alle 10s als JSON) ---

interval:
    - interval: 10s
      then:
          - mqtt.publish_json:
                topic: !lambda |-
                    return "cannaguide/plants/" + std::string("${plant_id}") + "/sensors/telemetry";
                qos: 1
                retain: true
                payload: |-
                    root["timestamp"] = id(sntp_time).now().strftime("%Y-%m-%dT%H:%M:%SZ");
                    root["plantId"] = "${plant_id}";
                    root["deviceId"] = "${device_name}";
                    root["temp"] = id(air_temp).state;
                    root["humidity"] = id(air_humidity).state;
                    root["vpd"] = id(vpd_sensor).state;
                    root["soilMoisture"] = id(soil_moisture).state;
                    root["battery"] = id(battery_sensor).state;

# --- OTA + Logging ---

ota:
    - platform: esphome
      password: !secret ota_password

logger:
    level: WARN
```

### 9.4 Secrets-Vorlage (secrets.yaml.example)

```yaml
# Kopiere diese Datei als 'secrets.yaml' und trage deine Werte ein.
# NIEMALS secrets.yaml committen!

wifi_ssid: 'MeinGrowWLAN'
wifi_password: 'DEIN_WIFI_PASSWORT'

mqtt_broker: '192.168.1.10' # Lokaler Mosquitto oder Cloud-Broker
mqtt_user: 'cannaguide'
mqtt_pass: 'DEIN_MQTT_PASSWORT'

ota_password: 'DEIN_OTA_PASSWORT'
```

---

## 10. MLX90614 IR-Sensor Leaf-Temp Integration

### 10.1 Warum Leaf-Temp wichtig ist

Die Blattoberflaechen-Temperatur weicht typischerweise 2-5 C von der Lufttemperatur ab
(hoeher bei starker Beleuchtung, niedriger bei hoher Transpiration). Fuer praezise VPD-
Berechnung ist die echte Leaf-Temp entscheidend:

- **VPD mit Leaf-Temp** = SVP(leaf_temp) - (SVP(air_temp) \* RH/100)
- **VPD ohne Leaf-Temp** nutzt statischen Offset (+3 C) -- ungenau bei wechselnden Bedingungen

### 10.2 MLX90614 Spezifikationen

| Eigenschaft         | Wert                                     |
| ------------------- | ---------------------------------------- |
| Messbereich         | -70 bis +380 C                           |
| Genauigkeit         | +/- 0.5 C (medizinisch)                  |
| Aufloesung          | 0.02 C                                   |
| Interface           | I2C (SDA/SCL)                            |
| Spannung            | 3.3V oder 5V                             |
| Messdistanz         | 5-15 cm (fuer Cannabis-Blaetter optimal) |
| FOV (Field of View) | 90 Grad (Standard) oder 5 Grad (Narrow)  |
| I2C-Adresse         | 0x5A (Standard)                          |

### 10.3 ESPHome YAML fuer MLX90614

Ergaenzung zu `vpd-pro.yaml`:

```yaml
# MLX90614 IR-Temperatur-Sensor (I2C)
i2c:
    sda: GPIO21
    scl: GPIO22
    scan: true

sensor:
    # ... (bestehende Sensoren) ...

    # MLX90614: Blattoberflaechen-Temperatur
    - platform: mlx90614
      ambient:
          id: mlx_ambient
          name: 'MLX Ambient Temperature'
      object:
          id: leaf_temp
          name: 'Leaf Temperature'
          unit_of_measurement: 'C'
          accuracy_decimals: 1
      address: 0x5A
      update_interval: 10s

    # Aktualisierter VPD-Sensor MIT echtem Leaf-Temp
    - platform: template
      id: vpd_sensor
      name: 'VPD (Leaf-Temp)'
      unit_of_measurement: 'kPa'
      accuracy_decimals: 2
      update_interval: 10s
      lambda: |-
          float t = id(air_temp).state;
          float rh = id(air_humidity).state;
          float lt = id(leaf_temp).state;
          if (isnan(t) || isnan(rh) || isnan(lt)) return NAN;
          float svp_air = 0.61078f * expf(17.2694f * t / (t + 238.3f));
          float svp_leaf = 0.61078f * expf(17.2694f * lt / (lt + 238.3f));
          float vpd = svp_leaf - (svp_air * (rh / 100.0f));
          return (vpd < 0.0f) ? 0.0f : vpd;
```

### 10.4 Telemetry-Payload mit Leaf-Temp

Aktualisierter `mqtt.publish_json` Block:

```yaml
payload: |-
    root["timestamp"] = id(sntp_time).now().strftime("%Y-%m-%dT%H:%M:%SZ");
    root["plantId"] = "${plant_id}";
    root["deviceId"] = "${device_name}";
    root["temp"] = id(air_temp).state;
    root["humidity"] = id(air_humidity).state;
    root["leafTemp"] = id(leaf_temp).state;
    root["vpd"] = id(vpd_sensor).state;
    root["soilMoisture"] = id(soil_moisture).state;
    root["battery"] = id(battery_sensor).state;
```

### 10.5 App-seitige Aenderungen (geplant)

1. `mqttSensorService.ts`: `leafTemp` Feld parsen und in `sensorStore` aufnehmen
2. `sensorStore.ts`: `SensorReading` Type um `leafTemp?: number` erweitern
3. `SensorIntegrationPanel.tsx`: Leaf-Temp-Anzeige + VPD-Vergleich (mit/ohne IR)
4. `proactiveCoachService.ts`: Leaf-Temp-basierte VPD-Thresholds (praeziser als Offset)

---

## 11. MQTT-Protokoll-Vertiefung

### 11.1 QoS-Strategie (Empfehlung)

| Datentyp                                    | QoS               | Begruendung                                     |
| ------------------------------------------- | ----------------- | ----------------------------------------------- |
| Hochfrequente Telemetry (temp, hum)         | 0 (At most once)  | Schnell, Verluste tolerierbar bei 10s-Intervall |
| VPD + Leaf-Temp                             | 1 (At least once) | Wichtig fuer Digital-Twin-Praezision            |
| Kritische Alerts (pH-Absturz, Ueberhitzung) | 2 (Exactly once)  | Kein Alert darf verloren gehen                  |
| Actuator-Commands (Ventilator on/off)       | 1 (At least once) | Muss ankommen, Duplikate sind idempotent        |
| Status (online/offline)                     | 1 + Retained      | Dashboard braucht aktuellen Status              |

### 11.2 Retained Messages

- **Aktivieren fuer:** Status-Topics, letzte Telemetry (Dashboard-Init bei Reconnect)
- **Deaktivieren fuer:** Commands (vermeidet Replay)
- **Broker-Side:** Mosquitto `max_inflight_messages 20`, `max_queued_messages 100`

### 11.3 Last Will and Testament (LWT)

```
Topic:   cannaguide/status/{deviceId}
Payload: "offline"
QoS:     1
Retain:  true
```

App-seitig: `mqttSensorService` subscribt `cannaguide/status/+` und aktualisiert
Device-Status in `sensorStore`. UI zeigt grauen Status-Dot bei "offline".

### 11.4 MQTT 5.0 Upgrade-Pfad

| Feature              | Nutzen fuer CannaGuide                                  | Prioritaet |
| -------------------- | ------------------------------------------------------- | ---------- |
| Topic Aliases        | Reduziert Payload-Overhead bei hochfrequenter Telemetry | M          |
| User Properties      | Plant-ID, Sensor-Type als Header (statt im Payload)     | M          |
| Enhanced Auth        | SCRAM-SHA-256 statt Plaintext-Password                  | H          |
| Shared Subscriptions | Multi-Device Load-Balancing bei vielen ESP32s           | L          |
| Message Expiry       | Auto-Purge alter Retained Messages                      | M          |
| Response Topic       | Request-Response fuer OTA-Commands                      | L          |

### 11.5 Reconnect-Strategie (Ziel-Implementierung)

```
Versuch 1: sofort (0ms)
Versuch 2: 1s
Versuch 3: 2s
Versuch 4: 4s
Versuch 5: 8s
Versuch 6+: 30s (max)
Nach 10 Fehlschlaegen: Connection-Error-Toast + manueller Retry-Button
Bei Reconnect: auto-reSubscribe aller Topics + Retained-Messages abrufen
```

---

## 12. Security-Hardening-Checkliste

### 12.1 Sofort (H)

- [ ] Broker-Credentials mit AES-256-GCM verschluesseln (cryptoService nutzen)
- [ ] WSS-Only-Enforcement: UI-Warnung bei ws://
- [ ] Subtopic-Validation: bereits vorhanden, regex verstaerken
- [ ] Payload-Size-Limit: bereits 64KB, beibehalten
- [ ] Rate-Limiting: max 100 Messages/Sekunde pro Topic

### 12.2 Mittelfristig (M)

- [ ] Topic-Namespace mit User-prefix: `cannaguide/{userId}/sensors/...`
- [ ] HMAC-Payload-Signing (optional, fuer Authentizitaet)
- [ ] Certificate-Pinning (fuer selbstgehostete Broker)
- [ ] Audit-Log: alle Connects/Disconnects in IndexedDB
- [ ] PIN-Lock fuer Gateway-Settings (Capacitor Biometric Plugin)

### 12.3 Langfristig (L)

- [ ] Mutual TLS (mTLS) fuer ESP32 <-> Broker
- [ ] MQTT 5.0 Enhanced Authentication (SCRAM-SHA-256)
- [ ] Zero-Trust: jedes Device bekommt eigenes Zertifikat
- [ ] Geraete-Provisioning via QR-Code (App generiert Credentials)

---

## 13. Performance-Optimierung

### 13.1 Web Worker fuer MQTT

**Problem:** MQTT-Message-Processing blockiert Main-Thread bei hoher Frequenz.

**Loesung:**

```
Main Thread                     MQTT Worker
-----------                     -----------
mqttSensorService.connect() --> worker.postMessage({ cmd: 'connect', config })
                            <-- worker.onmessage({ type: 'reading', data })
sensorStore.pushReading()
                            <-- worker.onmessage({ type: 'status', connected })
useIotStore.setStatus()
```

Integration ueber bestehenden `workerBus.ts` (Promise-basiert, Backpressure, Retry).

### 13.2 Throttling / Batching

- **Sensor-Updates:** Max 1 Re-Render pro Sekunde (requestAnimationFrame-gated)
- **Chart-Updates:** Max 1 Update pro 2 Sekunden (Recharts ist teuer)
- **Journal-Writes:** Batch 10 Readings -> 1 Journal-Entry (statt 10 einzelne)
- **Redux-Dispatch:** Debounce 1s (bereits im Store fuer IndexedDB)

### 13.3 Lazy-Loading

```typescript
// Nur laden wenn IoT aktiviert
const MqttModule = lazy(() => import('./services/mqttSensorService'))
const IotCharts = lazy(() => import('./components/IotCharts'))
```

### 13.4 Offline-Queue

```typescript
// Outgoing Commands puffern bei Disconnect
interface QueuedCommand {
    topic: string
    payload: string
    qos: 0 | 1 | 2
    timestamp: number
}
// Max 50 Commands, FIFO, IndexedDB-persistent
// Bei Reconnect: Flush in Reihenfolge
```

---

## 14. Timeline und Meilensteine

### Sprint 1: Stabilitaet und Security (Woche 1, 01.-07.04.2026)

| Tag | Massnahme                       | Kategorie       |
| --- | ------------------------------- | --------------- |
| 1-2 | #1 Reconnect + Backoff          | A (Stabilitaet) |
| 2   | #4 WSS-Force + Warnung          | A (Stabilitaet) |
| 3   | #3 Zod-Schema-Validation        | A (Stabilitaet) |
| 3-4 | #6 Credentials-Verschluesselung | B (Security)    |
| 4-5 | #2 Error-Boundary + Toast       | A (Stabilitaet) |
| 5-6 | #5 CI IoT-Mock pinnen           | A (Stabilitaet) |
| 7   | Review + Testen                 | --              |

**Ergebnis:** IoT-Modul von 6.8 auf ~7.8/10

### Sprint 2: Performance und UX (Woche 2, 08.-14.04.2026)

| Tag | Massnahme                  | Kategorie       |
| --- | -------------------------- | --------------- |
| 1-2 | #11 Throttling/Batching    | C (Performance) |
| 2-3 | #12 Bundle-Splitting       | C (Performance) |
| 3-4 | #21 Live Status-Indicator  | E (UX)          |
| 4-5 | #24 Onboarding-Wizard      | E (UX)          |
| 5-6 | #18 Telemetry-Export (CSV) | D (Feature)     |
| 7   | Review + Testen            | --              |

**Ergebnis:** IoT-Modul von ~7.8 auf ~8.5/10

### Sprint 3: Hardware-Ready (Woche 3-4, 15.-28.04.2026)

| #   | Massnahme                      | Kategorie       |
| --- | ------------------------------ | --------------- |
| 15  | ESP32/Tasmota/Sonoff Templates | D (Feature)     |
| 27  | IoT-Docs im Knowledge-Hub      | F (Docs)        |
| 14  | Multi-Broker Support           | D (Feature)     |
| 10  | MQTT Web Worker                | C (Performance) |
| 25  | E2E Full-Flow Tests            | F (Testing)     |
| 28  | Docker-Mock erweitern          | F (DevEx)       |

**Ergebnis:** IoT-Modul von ~8.5 auf ~9.0/10 -- Hardware-Ready

### Meilenstein 4: Advanced (Mai-Juni 2026)

- #17 VPD-Automation Rules Engine
- #16 BLE-Sensoren via Web BLE + Tauri
- #8 Topic-Namespace mit User-Prefix
- #22 Drag-and-Drop Sensor Mapping
- #26 Mutation-Tests (Stryker)

### Meilenstein 5: Vision (Q3-Q4 2026)

- #29 Native Tauri IoT-Plugins (Rust MQTT/Serial/GPIO)
- #30 WebGPU Telemetry-ML (Predictive VPD)
- #32 Home Assistant Integration
- #19 AR-Plant-Overlay
- #31 Federated IoT (Community Trends)

---

## 15. Dateireferenzen

### IoT-Services

| Datei                   | Pfad                                             |
| ----------------------- | ------------------------------------------------ |
| MQTT Client Service     | `apps/web/services/mqttClientService.ts`         |
| MQTT Sensor Service     | `apps/web/services/mqttSensorService.ts`         |
| Web Bluetooth Service   | `apps/web/services/webBluetoothSensorService.ts` |
| Tauri IPC Service       | `apps/web/services/tauriIpcService.ts`           |
| Proactive Coach Service | `apps/web/services/proactiveCoachService.ts`     |
| Native Bridge Service   | `apps/web/services/nativeBridgeService.ts`       |
| AI Facade               | `apps/web/services/aiFacade.ts`                  |

### Stores

| Datei              | Pfad                                |
| ------------------ | ----------------------------------- |
| IoT Settings Store | `apps/web/stores/useIotStore.ts`    |
| Sensor Data Store  | `apps/web/stores/sensorStore.ts`    |
| Alerts Store       | `apps/web/stores/useAlertsStore.ts` |

### UI-Komponenten

| Datei                    | Pfad                                                          |
| ------------------------ | ------------------------------------------------------------- |
| Sensor Integration Panel | `apps/web/components/views/plants/SensorIntegrationPanel.tsx` |
| IoT Settings Tab         | `apps/web/components/views/settings/IotSettingsTab.tsx`       |

### Mock-Infrastruktur

| Datei             | Pfad                              |
| ----------------- | --------------------------------- |
| ESP32 Mock Server | `docker/esp32-mock/server.mjs`    |
| IoT Mock Server   | `docker/iot-mocks/src/server.mjs` |
| Docker Compose    | `docker-compose.yml`              |

### Testing

| Datei                  | Pfad                                              |
| ---------------------- | ------------------------------------------------- |
| E2E IoT Tests          | `apps/web/tests/e2e/iot-sensor-simulation.e2e.ts` |
| MQTT Sensor Unit Tests | `apps/web/services/mqttSensorService.test.ts`     |

### Verwandte Docs

| Datei                | Pfad                            |
| -------------------- | ------------------------------- |
| Haupt-Roadmap        | `ROADMAP.md`                    |
| Prioritaets-Roadmap  | `docs/PRIORITY_ROADMAP.md`      |
| Architektur          | `docs/ARCHITECTURE.md`          |
| Worker-Bus           | `docs/worker-bus.md`            |
| Monorepo-Architektur | `docs/monorepo-architecture.md` |

---

_Dieses Dokument wird bei jeder IoT-relevanten Session aktualisiert.
Letzte Aktualisierung: 2026-04-01, Session 14._
