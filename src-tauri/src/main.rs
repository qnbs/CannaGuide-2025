#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ipc;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            ipc::process_image_binary,
            ipc::read_sensor_binary,
            ipc::get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
