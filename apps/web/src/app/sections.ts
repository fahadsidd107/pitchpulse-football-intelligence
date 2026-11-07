export const sections = [
  { path: '/', label: 'Home', description: 'Your view of the beautiful game.' },
  { path: '/matches', label: 'Live Matches', description: 'Select a fixture to see its score, competition and kickoff. The source label distinguishes the fictional demo from delayed provider results.' },
  { path: '/competitions', label: 'Competitions', description: 'Browse competition records and inspect their season details.' },
  { path: '/clubs', label: 'Clubs', description: 'Browse clubs, inspect their records and save your favourites.' },
  { path: '/players', label: 'Players', description: 'Inspect player dossiers and compare the figures provided for each record.' },
  { path: '/rankings', label: 'Rankings', description: 'Read each ranking alongside its scope and evidence.' },
  { path: '/ai-analyst', label: 'AI Analyst', description: 'Try a scripted evidence walkthrough. Choose a question to see what the selected record supports.' },
  { path: '/tactical-lab', label: 'Tactical Lab', description: 'Open a tactical note and try the stadium’s interactive passing patterns.' },
  { path: '/simulator', label: 'Dream Simulator', description: 'Pick a fictional scenario, choose a game plan and replay a seeded illustration.' },
  { path: '/fantasy', label: 'Fantasy', description: 'Explore the fictional leaderboard and select an entry to follow.' },
  { path: '/news', label: 'News', description: 'Browse the fictional newsroom and archive. Each entry carries its source mode.' },
  { path: '/transfers', label: 'Transfers', description: 'Explore the fictional transfer desk and inspect the status on each entry.' },
]
export function searchSections(query: string) { const term = query.trim().toLowerCase(); return sections.filter(section => !term || section.label.toLowerCase().includes(term)) }
