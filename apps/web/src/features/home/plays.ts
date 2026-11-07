// Authored demonstration coordinates, expressed in stadium model units.
export interface Play { label: string; description: string; points: [number, number][] }
export const plays: Play[] = [
  { label: 'Build-up', description: 'A short passing triangle takes the ball out of defence and into midfield.', points: [[-4.5, 0], [-3.4, -1.9], [-2.1, -.2], [-.8, -1.1]] },
  { label: 'Switch play', description: 'Draw play toward one touchline, then find space on the opposite wing.', points: [[-.8, -1.1], [.6, -2.6], [2.8, 2.5]] },
  { label: 'Finish', description: 'A cutback from the wing sets up a first-time shot toward the far post.', points: [[2.8, 2.5], [4.4, 1.7], [3.3, .1], [5.1, -.43]] },
]
