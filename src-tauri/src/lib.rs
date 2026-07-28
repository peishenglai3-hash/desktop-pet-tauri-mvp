mod llm;

use llm::{ProviderSecret, SendChatRequest};
use tauri::Manager;

#[tauri::command]
async fn send_chat(request: SendChatRequest) -> Result<String, String> {
    llm::send_chat(request).await.map_err(|error| error.to_string())
}

#[tauri::command]
async fn save_provider_secret(config: ProviderSecret) -> Result<(), String> {
    llm::save_provider_secret(config)
        .await
        .map_err(|error| error.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let tray_menu = tauri::menu::Menu::with_items(
                app,
                &[
                    &tauri::menu::MenuItem::with_id(app, "show", "显示", true, None::<&str>)?,
                    &tauri::menu::MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?,
                ],
            )?;

            let _tray = tauri::tray::TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![send_chat, save_provider_secret])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
