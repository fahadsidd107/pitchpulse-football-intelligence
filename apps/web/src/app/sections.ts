export const sections = [
  { path: '/', label: 'Home', description: 'Your view of the beautiful game.' },
  { path: '/matches', label: 'Live Matches', description: 'Fixtures, timelines and match intelligence will appear when a football provider is connected.' },
  { path: '/competitions', label: 'Competitions', description: 'Explore competitions, season tables and fixtures when competition data is available.' },
  { path: '/clubs', label: 'Clubs', description: 'Follow your clubs and explore squad profiles when club data is available.' },
  { path: '/players', label: 'Players', description: 'Player profiles, scorers, assists and player of the week await verified player data.' },
  { path: '/rankings', label: 'Rankings', description: 'Position-aware player rankings will include their methodology and coverage.' },
  { path: '/ai-analyst', label: 'AI Analyst', description: 'Ask questions grounded in match evidence. AI analysis is not connected yet.' },
  { path: '/tactical-lab', label: 'Tactical Lab', description: 'Explore formations and tactical analyses when attributed match evidence is available.' },
  { path: '/simulator', label: 'Dream Simulator', description: 'Build cross-era teams and explore clearly labeled hypothetical matches in a future milestone.' },
  { path: '/fantasy', label: 'Fantasy', description: 'Season-long squads and matchday predictions are coming. No contests or leaderboards are active.' },
  { path: '/news', label: 'News', description: 'Attributed football reporting and historical on-this-day stories will appear here.' },
  { path: '/transfers', label: 'Transfers', description: 'Dated, attributed rumours and confirmed moves will remain clearly distinguished.' },
]
export function searchSections(query: string) { const term = query.trim().toLowerCase(); return sections.filter(section => !term || section.label.toLowerCase().includes(term)) }
