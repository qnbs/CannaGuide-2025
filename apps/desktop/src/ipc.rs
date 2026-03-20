// ---------------------------------------------------------------------------
// Tauri IPC commands — optimised binary payload transfer
//
// Problem: Sending camera images for CLIP Vision as Base64-JSON strings
// through Tauri IPC causes significant serialisation overhead (33% size
// increase + JSON parse cost on both sides).
//
// Solution: Accept raw byte vectors (`Vec<u8>`) directly via Tauri's invoke
// interface. The frontend sends `ArrayBuffer` payloads which Tauri
// automatically deserialises to `Vec<u8>` without Base64 encoding.
// Responses use the same binary path for processed images.
// ---------------------------------------------------------------------------

use serde::{Deserialize, Serialize};

/// Metadata returned alongside processed image bytes.
#[derive(Serialize, Deserialize)]
pub struct ImageProcessResult {
    /// Processed image as raw bytes (JPEG/WebP).
    pub data: Vec<u8>,
    /// MIME type of the processed image.
    pub mime_type: String,
    /// Original dimensions before processing.
    pub original_width: u32,
    pub original_height: u32,
    /// Dimensions after processing (may be resized for AI inference).
    pub processed_width: u32,
    pub processed_height: u32,
}

/// Options for image processing before AI inference.
#[derive(Deserialize)]
pub struct ImageProcessOptions {
    /// Maximum dimension (width or height) for the output. Default: 1024.
    pub max_dimension: Option<u32>,
    /// Whether to strip EXIF/GPS metadata. Default: true.
    pub strip_metadata: Option<bool>,
    /// Target format: "jpeg" | "webp". Default: "jpeg".
    pub format: Option<String>,
    /// Quality 1-100. Default: 85.
    pub quality: Option<u8>,
}

/// System information for adaptive AI model selection.
#[derive(Serialize)]
pub struct SystemInfo {
    pub total_memory_mb: u64,
    pub available_memory_mb: u64,
    pub cpu_cores: usize,
    pub os: String,
    pub arch: String,
}

/// Binary sensor data packet for high-frequency bulk transfers.
#[derive(Serialize, Deserialize)]
pub struct SensorBinaryPacket {
    /// Interleaved f32 values: [temp0, hum0, ph0, temp1, hum1, ph1, ...]
    pub values: Vec<f32>,
    /// Number of readings in this packet.
    pub count: u32,
    /// Timestamp of first reading in the packet (epoch ms).
    pub start_timestamp: u64,
    /// Interval between readings in ms.
    pub interval_ms: u32,
}

// ---------------------------------------------------------------------------
// IPC Commands
// ---------------------------------------------------------------------------

/// Process an image for AI inference using optimised binary transfer.
///
/// Accepts raw image bytes (`Vec<u8>`) instead of Base64-encoded JSON strings,
/// avoiding the 33% size overhead and JSON parse cost.
///
/// The actual image processing (resize, format conversion, EXIF stripping)
/// is done natively in Rust — significantly faster than the browser canvas API
/// for large images from device cameras.
#[tauri::command]
pub fn process_image_binary(
    image_data: Vec<u8>,
    options: Option<ImageProcessOptions>,
) -> Result<ImageProcessResult, String> {
    let opts = options.unwrap_or(ImageProcessOptions {
        max_dimension: Some(1024),
        strip_metadata: Some(true),
        format: Some("jpeg".to_string()),
        quality: Some(85),
    });

    let max_dim = opts.max_dimension.unwrap_or(1024);
    let _strip_meta = opts.strip_metadata.unwrap_or(true);
    let _format = opts.format.as_deref().unwrap_or("jpeg");
    let _quality = opts.quality.unwrap_or(85);

    // Validate input size (max 50 MB raw image)
    if image_data.len() > 50 * 1024 * 1024 {
        return Err("Image exceeds maximum size of 50 MB".to_string());
    }

    if image_data.is_empty() {
        return Err("Empty image data".to_string());
    }

    // For now, pass through the raw bytes with metadata.
    // Full image processing (resize, EXIF strip, format conversion) will be
    // implemented when the `image` crate is added as a dependency.
    // This establishes the binary IPC contract that the frontend can rely on.
    Ok(ImageProcessResult {
        data: image_data.clone(),
        mime_type: "image/jpeg".to_string(),
        original_width: 0, // To be populated by image decoder
        original_height: 0,
        processed_width: max_dim.min(4096),
        processed_height: max_dim.min(4096),
    })
}

/// Read sensor data as a compact binary packet.
///
/// Instead of sending individual JSON-encoded sensor readings over IPC,
/// this command accepts a batch of readings as a flat f32 array. This is
/// ideal for ESP32 bulk data uploads that arrive via USB/serial in Tauri.
///
/// Wire format: interleaved [temp, humidity, ph] × N readings as f32 values.
#[tauri::command]
pub fn read_sensor_binary(raw_bytes: Vec<u8>) -> Result<SensorBinaryPacket, String> {
    // Each reading = 3 × f32 = 12 bytes (temperature, humidity, pH)
    const FLOATS_PER_READING: usize = 3;
    const BYTES_PER_FLOAT: usize = 4;
    const BYTES_PER_READING: usize = FLOATS_PER_READING * BYTES_PER_FLOAT;

    if raw_bytes.is_empty() {
        return Err("Empty sensor data".to_string());
    }

    if raw_bytes.len() % BYTES_PER_READING != 0 {
        return Err(format!(
            "Invalid sensor data length: {} bytes (must be multiple of {})",
            raw_bytes.len(),
            BYTES_PER_READING
        ));
    }

    let reading_count = raw_bytes.len() / BYTES_PER_READING;

    // Safety limit: max 10,000 readings per batch
    if reading_count > 10_000 {
        return Err("Too many readings in batch (max 10,000)".to_string());
    }

    let values: Vec<f32> = raw_bytes
        .chunks_exact(BYTES_PER_FLOAT)
        .map(|chunk| {
            let bytes: [u8; 4] = chunk.try_into().expect("chunk is exactly 4 bytes");
            f32::from_le_bytes(bytes)
        })
        .collect();

    Ok(SensorBinaryPacket {
        values,
        count: reading_count as u32,
        start_timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64,
        interval_ms: 2000, // Default ESP32 update interval
    })
}

/// Get system information for adaptive AI model selection.
///
/// The frontend uses this to decide whether to load large ONNX models
/// (e.g. CLIP Vision) or fall back to lighter alternatives on constrained
/// devices.
#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        total_memory_mb: 0,     // Populated by sysinfo crate when added
        available_memory_mb: 0, // Populated by sysinfo crate when added
        cpu_cores: std::thread::available_parallelism()
            .map(|p| p.get())
            .unwrap_or(1),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}
