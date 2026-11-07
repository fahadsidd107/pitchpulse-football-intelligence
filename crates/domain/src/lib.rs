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

/// A stable internal identifier, independent of provider IDs.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct EntityId(String);
impl EntityId {
    pub fn parse(value: &str) -> Result<Self, &'static str> {
        if value.is_empty()
            || value.len() > 128
            || !value
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
        {
            return Err("invalid entity ID");
        }
        Ok(Self(value.to_owned()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}
pub mod scoring;
