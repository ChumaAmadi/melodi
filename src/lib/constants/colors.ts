export const GENRE_COLORS = {
  rap: 'rgba(255, 158, 87, 0.85)',    // Peach Neon - warm orange-pink for rap/hip-hop
  hiphop: 'rgba(255, 158, 87, 0.85)', // Peach Neon - matching rap
  randb: 'rgba(255, 213, 128, 0.85)', // Soft Gold - balanced glow for R&B
  rnb: 'rgba(255, 213, 128, 0.85)',   // Soft Gold - matching randb
  trap: 'rgba(255, 139, 92, 0.85)',   // Neon Tangerine - bright alternative for trap
  pop: 'rgba(255, 92, 168, 0.85)',    // Electric Rose - energetic pink for pop
  rock: 'rgba(164, 182, 255, 0.85)',  // Dream Blue - glowy steel blue for rock
  electronic: 'rgba(46, 254, 200, 0.85)', // Aqua Pulse - clean mint for electronic
  alternative: 'rgba(201, 182, 241, 0.85)', // Lilac Glow - soft lavender for alternative
  other: 'rgba(221, 160, 221, 0.85)'  // Glow Plum - light plum for other genres
} as const;

// Chart theme constants
export const CHART_THEME = {
  grid: {
    color: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.9)',
    secondary: 'rgba(255, 255, 255, 0.7)',
  },
  tooltip: {
    background: 'rgba(255, 255, 255, 0.9)',
    text: '#1a1a1a',
    border: 'rgba(167, 139, 250, 0.5)',
  }
} as const; 