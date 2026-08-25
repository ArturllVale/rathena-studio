use std::env;
use std::path::PathBuf;

fn main() {
    // If on Windows GNU, prepend local wrapper to PATH to fix MinGW space-in-path bug
    if cfg!(target_os = "windows") {
        let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap_or_default());
        let bin_dir = manifest_dir.join("bin");
        if bin_dir.exists() {
            if let Ok(current_path) = env::var("PATH") {
                env::set_var("PATH", format!("{};{}", bin_dir.display(), current_path));
            }
        }
    }

    let attrs = tauri_build::Attributes::new();
    tauri_build::try_build(attrs).expect("failed to run tauri-build");
}
