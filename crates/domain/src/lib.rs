//! Framework-independent domain constants. Football entities arrive in Step 04.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DataMode {
    Mock,
}
impl DataMode {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Mock => "MOCK",
        }
    }
}
