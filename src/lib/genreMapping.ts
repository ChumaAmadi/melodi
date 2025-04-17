interface GenreCategory {
  mainGenre: string;
  subGenres: string[];
}

interface GenreMap {
  [key: string]: GenreCategory;
}

// Main genre categories with their associated subgenres
export const genreCategories: GenreMap = {
  'rap': {
    mainGenre: 'rap',
    subGenres: [
      'hip-hop', 'trap', 'conscious hip hop', 'southern hip hop', 'pop rap',
      'gangster rap', 'underground rap', 'alternative hip hop', 'atlanta hip hop',
      'melodic rap', 'modern rap', 'rap', 'hip hop', 'urban contemporary',
      'drill', 'mumble rap', 'cloud rap', 'trap soul', 'rage rap',
      'pluggnb', 'hyperpop rap', 'boom bap', 'grime', 'uk rap', 'west coast rap',
      'east coast rap', 'dirty south', 'crunk', 'horrorcore', 'abstract hip hop',
      'instrumental hip hop', 'hardcore hip hop', 'old school hip hop'
    ]
  },
  'r&b': {
    mainGenre: 'r&b',
    subGenres: [
      'soul', 'neo soul', 'contemporary r&b', 'rhythm and blues',
      'alternative r&b', 'trap soul', 'pop soul', 'future soul',
      'indie r&b', 'experimental r&b', 'funk', 'modern soul',
      'quiet storm', 'new jack swing', 'gospel', 'motown',
      'blues', 'urban contemporary', 'soul blues', 'deep soul',
      'southern soul', 'psychedelic soul', 'memphis soul'
    ]
  },
  'pop': {
    mainGenre: 'pop',
    subGenres: [
      'dance pop', 'electropop', 'indie pop', 'synth-pop', 'art pop',
      'chamber pop', 'baroque pop', 'dream pop', 'k-pop', 'j-pop',
      'teen pop', 'europop', 'sophisti-pop', 'power pop', 'sunshine pop',
      'bedroom pop', 'hyperpop', 'pop rock', 'pop punk', 'dance-pop',
      'adult contemporary', 'bubblegum pop', 'indie pop', 'alternative pop'
    ]
  },
  'rock': {
    mainGenre: 'rock',
    subGenres: [
      'alternative rock', 'indie rock', 'hard rock', 'classic rock', 'punk rock',
      'psychedelic rock', 'progressive rock', 'metal', 'grunge', 'post-rock',
      'midwest emo', 'emo', 'post-hardcore', 'math rock', 'indie emo',
      'alternative emo', 'screamo', 'post-emo', 'emo revival', 'garage rock',
      'art rock', 'experimental rock', 'folk rock', 'southern rock',
      'blues rock', 'stoner rock', 'space rock', 'surf rock',
      'rockabilly', 'proto-punk', 'post-punk', 'new wave'
    ]
  },
  'electronic': {
    mainGenre: 'electronic',
    subGenres: [
      'house', 'techno', 'edm', 'dubstep', 'drum and bass', 'ambient',
      'trance', 'electronica', 'downtempo', 'idm', 'breakbeat', 'garage',
      'uk garage', 'future bass', 'synthwave', 'vaporwave', 'chillwave',
      'industrial', 'electro', 'big room', 'deep house', 'tech house',
      'minimal techno', 'hardstyle', 'jungle', 'glitch', 'bass music',
      'experimental electronic', 'electroclash', 'nu disco'
    ]
  },
  'jazz': {
    mainGenre: 'jazz',
    subGenres: [
      'bebop', 'swing', 'fusion', 'smooth jazz', 'cool jazz', 'big band',
      'avant-garde jazz', 'contemporary jazz', 'latin jazz', 'modal jazz',
      'hard bop', 'post-bop', 'free jazz', 'spiritual jazz', 'jazz funk',
      'jazz fusion', 'nu jazz', 'acid jazz', 'jazz rap', 'bossa nova',
      'dixieland', 'gypsy jazz', 'chamber jazz', 'third stream'
    ]
  },
  'classical': {
    mainGenre: 'classical',
    subGenres: [
      'baroque', 'romantic', 'contemporary classical', 'opera', 'symphony',
      'chamber music', 'minimalism', 'modern classical', 'orchestral',
      'classical period', 'renaissance', 'medieval', 'impressionist',
      'expressionist', 'avant-garde classical', 'neo-classical',
      'post-classical', 'film score', 'modern composition'
    ]
  },
  'latin': {
    mainGenre: 'latin',
    subGenres: [
      'reggaeton', 'salsa', 'latin pop', 'bachata', 'latin jazz', 'merengue',
      'latin rock', 'tropical', 'latin alternative', 'latin hip hop',
      'latin trap', 'dembow', 'cumbia', 'vallenato', 'latin folk',
      'bossa nova', 'samba', 'tango', 'mariachi', 'ranchera',
      'banda', 'regional mexican', 'latin fusion', 'latin urban'
    ]
  },
  'folk': {
    mainGenre: 'folk',
    subGenres: [
      'contemporary folk', 'traditional folk', 'folk rock', 'indie folk',
      'americana', 'bluegrass', 'country folk', 'folk pop', 'freak folk',
      'progressive folk', 'celtic', 'world folk', 'folk punk',
      'anti-folk', 'british folk', 'appalachian folk'
    ]
  },
  'country': {
    mainGenre: 'country',
    subGenres: [
      'contemporary country', 'traditional country', 'country pop',
      'country rock', 'bluegrass', 'americana', 'country folk',
      'alt-country', 'outlaw country', 'country rap', 'bro-country',
      'nashville sound', 'honky tonk', 'western swing'
    ]
  }
};

// Create a reverse lookup map for quick genre normalization
const reverseGenreMap = new Map<string, string>();

// Initialize reverse lookup map
for (const [mainGenre, category] of Object.entries(genreCategories)) {
  reverseGenreMap.set(mainGenre.toLowerCase(), mainGenre);
  for (const subGenre of category.subGenres) {
    reverseGenreMap.set(subGenre.toLowerCase(), mainGenre);
  }
}

export function normalizeGenre(genre: string): string {
  // Clean up the genre string
  const cleanGenre = genre.toLowerCase().trim();
  
  // Check if this genre maps to a main genre
  const normalizedGenre = reverseGenreMap.get(cleanGenre);
  
  // If we can't find a mapping but the genre contains certain keywords,
  // map it to appropriate main genre
  if (!normalizedGenre) {
    // Rap/Hip-Hop related keywords
    if (cleanGenre.includes('rap') || 
        cleanGenre.includes('hip') || 
        cleanGenre.includes('trap') ||
        cleanGenre.includes('mc') ||
        cleanGenre.includes('spitting')) {
      return 'rap';
    }
    
    // R&B/Soul related keywords
    if (cleanGenre.includes('r&b') || 
        cleanGenre.includes('rnb') ||
        cleanGenre.includes('soul') ||
        cleanGenre.includes('rhythm and blues')) {
      return 'r&b';
    }
    
    // Rock related keywords
    if (cleanGenre.includes('rock') ||
        cleanGenre.includes('metal') ||
        cleanGenre.includes('punk') ||
        cleanGenre.includes('grunge') ||
        cleanGenre.includes('emo') ||
        cleanGenre.includes('hardcore')) {
      return 'rock';
    }
    
    // Electronic related keywords
    if (cleanGenre.includes('electronic') ||
        cleanGenre.includes('techno') ||
        cleanGenre.includes('house') ||
        cleanGenre.includes('edm') ||
        cleanGenre.includes('dance') ||
        cleanGenre.includes('beat')) {
      return 'electronic';
    }
    
    // Pop related keywords
    if (cleanGenre.includes('pop') ||
        cleanGenre.includes('-pop') ||
        cleanGenre.includes('teen') ||
        cleanGenre.includes('chart')) {
      return 'pop';
    }
    
    // Latin related keywords
    if (cleanGenre.includes('latin') ||
        cleanGenre.includes('reggaeton') ||
        cleanGenre.includes('salsa') ||
        cleanGenre.includes('bachata') ||
        cleanGenre.includes('merengue')) {
      return 'latin';
    }
    
    // Folk related keywords
    if (cleanGenre.includes('folk') ||
        cleanGenre.includes('acoustic') ||
        cleanGenre.includes('traditional') ||
        cleanGenre.includes('americana')) {
      return 'folk';
    }
    
    // Country related keywords
    if (cleanGenre.includes('country') ||
        cleanGenre.includes('bluegrass') ||
        cleanGenre.includes('western') ||
        cleanGenre.includes('nashville')) {
      return 'country';
    }
  }
  
  return normalizedGenre || 'other';
}

export function categorizeGenres(genres: string[]): string[] {
  if (!genres || genres.length === 0) return ['other'];

  // Count occurrences of main genres
  const genreCounts = new Map<string, number>();
  
  for (const genre of genres) {
    const normalizedGenre = normalizeGenre(genre);
    genreCounts.set(
      normalizedGenre, 
      (genreCounts.get(normalizedGenre) || 0) + 1
    );
  }

  // Sort by count and then alphabetically
  const sortedGenres = Array.from(genreCounts.entries())
    .sort(([genreA, countA], [genreB, countB]) => {
      if (countA !== countB) return countB - countA;
      return genreA.localeCompare(genreB);
    })
    .map(([genre]) => genre);

  return sortedGenres.length > 0 ? sortedGenres : ['other'];
}

// Function to get related genres
export function getRelatedGenres(genre: string): string[] {
  const mainGenre = normalizeGenre(genre);
  return genreCategories[mainGenre]?.subGenres || [];
} 