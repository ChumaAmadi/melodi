export const GENRE_COLORS = {
  rap: 'rgba(255, 158, 87, 0.85)',    // Peach Neon (#FF9E57)
  hiphop: 'rgba(255, 158, 87, 0.85)', // Peach Neon (#FF9E57)
  randb: 'rgba(255, 213, 128, 0.85)', // Soft Gold (#FFD580)
  rnb: 'rgba(255, 213, 128, 0.85)',   // Soft Gold (#FFD580)
  'r&b': 'rgba(255, 213, 128, 0.85)', // Soft Gold (#FFD580)
  trap: 'rgba(255, 139, 92, 0.85)',   // Neon Tangerine (#FF8B5C)
  pop: 'rgba(255, 92, 168, 0.85)',    // Electric Rose (#FF5CA8)
  rock: 'rgba(164, 182, 255, 0.85)',  // Dream Blue (#A4B6FF)
  electronic: 'rgba(46, 254, 200, 0.85)', // Aqua Pulse (#2EFEC8)
  alternative: 'rgba(201, 182, 241, 0.85)', // Lilac Glow (#C9B6F1)
  jazz: 'rgba(123, 223, 242, 0.85)',   // Bright Sky (#7BDFF2)
  classical: 'rgba(215, 178, 242, 0.85)', // Fresh Lavender (#D7B2F2)
  latin: 'rgba(221, 160, 221, 0.85)',  // Glow Plum (#DDA0DD)
  folk: 'rgba(201, 182, 241, 0.85)',  // Lilac Glow (#C9B6F1)
  country: 'rgba(255, 139, 92, 0.85)', // Neon Tangerine (#FF8B5C)
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