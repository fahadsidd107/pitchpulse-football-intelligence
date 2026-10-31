//! Application metadata; no provider-backed facts are exposed in Step 02.
pub use pitchpulse_domain::DataMode;
pub struct SystemInfo {
    pub name: &'static str,
    pub data_mode: DataMode,
    pub football_data_available: bool,
}
pub fn system_info() -> SystemInfo {
    SystemInfo {
        name: "PitchPulse",
        data_mode: DataMode::Mock,
        football_data_available: false,
    }
}
