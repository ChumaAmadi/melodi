export const GENRE_COLORS = {
  rap: 'rgba(255, 158, 87, 0.85)',    // Peach Neon - warm orange-pink for rap/hip-hop
  hiphop: 'rgba(255, 158, 87, 0.85)', // Peach Neon - matching rap
  randb: 'rgba(255, 213, 128, 0.85)', // Soft Gold - balanced glow for R&B
  rnb: 'rgba(255, 213, 128, 0.85)',   // Soft Gold - matching randb
  'r&b': 'rgba(255, 213, 128, 0.85)', // Soft Gold - matching randb
  trap: 'rgba(255, 139, 92, 0.85)',   // Neon Tangerine - bright alternative for trap
  pop: 'rgba(255, 92, 168, 0.85)',    // Electric Rose - energetic pink for pop
  rock: 'rgba(164, 182, 255, 0.85)',  // Dream Blue - glowy steel blue for rock
  electronic: 'rgba(46, 254, 200, 0.85)', // Aqua Pulse - clean mint for electronic
  alternative: 'rgba(201, 182, 241, 0.85)', // Lilac Glow - soft lavender for alternative
  jazz: 'rgba(255, 183, 77, 0.85)',   // Warm Amber - smooth golden for jazz
  classical: 'rgba(230, 230, 250, 0.85)', // Lavender Mist - elegant light purple for classical
  latin: 'rgba(255, 99, 132, 0.85)',  // Vibrant Coral - energetic red-pink for latin
  folk: 'rgba(156, 192, 109, 0.85)',  // Sage Green - earthy green for folk
  country: 'rgba(255, 178, 102, 0.85)', // Warm Peach - rustic orange for country
  other: 'rgba(189, 195, 199, 0.85)'  // Cool Gray - neutral gray for other genres
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