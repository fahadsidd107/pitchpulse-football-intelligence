//! Versioned demo rules: auditable calculations, no provider-supplied leaderboard points.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Position {
    Goalkeeper,
    Defender,
    Midfielder,
    Forward,
}
#[derive(Clone, Copy, Debug)]
pub struct Performance {
    pub position: Position,
    pub minutes: u16,
    pub goals: i16,
    pub assists: i16,
    pub yellow: i16,
    pub red: i16,
    pub clean_sheet: bool,
}
pub fn fantasy(p: Performance) -> Result<i32, &'static str> {
    if p.minutes > 130 || [p.goals, p.assists, p.yellow, p.red].iter().any(|v| *v < 0) {
        return Err("invalid performance");
    }
    if p.minutes == 0 {
        return Ok(0);
    }
    let goal = match p.position {
        Position::Goalkeeper | Position::Defender => 6,
        Position::Midfielder => 5,
        Position::Forward => 4,
    };
    let clean = if p.clean_sheet && p.minutes >= 60 {
        match p.position {
            Position::Goalkeeper | Position::Defender => 4,
            Position::Midfielder => 1,
            _ => 0,
        }
    } else {
        0
    };
    Ok(
        if p.minutes >= 60 { 2 } else { 1 } + i32::from(p.goals) * goal + i32::from(p.assists) * 3
            - i32::from(p.yellow)
            - i32::from(p.red) * 3
            + clean,
    )
}
pub fn rating(p: Performance) -> Result<(f64, f64), &'static str> {
    fantasy(p)?;
    if p.minutes == 0 {
        return Ok((0., 0.));
    }
    let confidence = f64::from(p.minutes) / (f64::from(p.minutes) + 90.);
    let goals = match p.position {
        Position::Goalkeeper | Position::Defender => 1.6,
        Position::Midfielder => 1.3,
        Position::Forward => 1.1,
    };
    let impact = f64::from(p.goals) * goals + f64::from(p.assists) * 0.7
        - f64::from(p.yellow) * 0.2
        - f64::from(p.red) * 1.2;
    Ok(((6. + impact * confidence).clamp(0., 10.), confidence))
}
pub fn prediction(pick: (u16, u16), actual: (u16, u16)) -> u16 {
    if pick == actual {
        5
    } else if (i32::from(pick.0) - i32::from(pick.1)).signum()
        == (i32::from(actual.0) - i32::from(actual.1)).signum()
    {
        2
    } else {
        0
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn p() -> Performance {
        Performance {
            position: Position::Forward,
            minutes: 90,
            goals: 3,
            assists: 0,
            yellow: 0,
            red: 0,
            clean_sheet: false,
        }
    }
    #[test]
    fn hattrick() {
        assert_eq!(fantasy(p()), Ok(14));
        assert!(rating(p()).unwrap().0 > 7.);
    }
    #[test]
    fn shrink_short_appearances() {
        let long = rating(p()).unwrap();
        let short = rating(Performance { minutes: 10, ..p() }).unwrap();
        assert!(short.0 < long.0);
        assert!(short.1 < long.1);
    }
    #[test]
    fn no_appearance_no_points() {
        assert_eq!(fantasy(Performance { minutes: 0, ..p() }), Ok(0));
    }
    #[test]
    fn invalid() {
        assert!(fantasy(Performance { goals: -1, ..p() }).is_err());
    }
    #[test]
    fn predictions() {
        assert_eq!(prediction((2, 1), (2, 1)), 5);
        assert_eq!(prediction((3, 1), (2, 1)), 2);
        assert_eq!(prediction((1, 2), (2, 1)), 0);
    }
}
