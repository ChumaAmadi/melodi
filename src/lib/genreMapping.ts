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
      'pluggnb', 'hyperpop rap'
    ]
  },
  'r&b': {
    mainGenre: 'r&b',
    subGenres: [
      'soul', 'neo soul', 'contemporary r&b', 'rhythm and blues',
      'alternative r&b', 'trap soul', 'pop soul', 'future soul',
      'indie r&b', 'experimental r&b', 'funk', 'modern soul'
    ]
  },
  'pop': {
    mainGenre: 'pop',
    subGenres: [
      'dance pop', 'electropop', 'indie pop', 'synth-pop', 'art pop',
      'chamber pop', 'baroque pop', 'dream pop', 'k-pop', 'j-pop'
    ]
  },
  'rock': {
    mainGenre: 'rock',
    subGenres: [
      'alternative rock', 'indie rock', 'hard rock', 'classic rock', 'punk rock',
      'psychedelic rock', 'progressive rock', 'metal', 'grunge', 'post-rock'
    ]
  },
  'electronic': {
    mainGenre: 'electronic',
    subGenres: [
      'house', 'techno', 'edm', 'dubstep', 'drum and bass', 'ambient',
      'trance', 'electronica', 'downtempo', 'idm'
    ]
  },
  'jazz': {
    mainGenre: 'jazz',
    subGenres: [
      'bebop', 'swing', 'fusion', 'smooth jazz', 'cool jazz', 'big band',
      'avant-garde jazz', 'contemporary jazz', 'latin jazz', 'modal jazz'
    ]
  },
  'classical': {
    mainGenre: 'classical',
    subGenres: [
      'baroque', 'romantic', 'contemporary classical', 'opera', 'symphony',
      'chamber music', 'minimalism', 'modern classical', 'orchestral'
    ]
  },
  'latin': {
    mainGenre: 'latin',
    subGenres: [
      'reggaeton', 'salsa', 'latin pop', 'bachata', 'latin jazz', 'merengue',
      'latin rock', 'tropical', 'latin alternative', 'latin hip hop'
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
    if (cleanGenre.includes('rap') || cleanGenre.includes('hip') || cleanGenre.includes('trap')) {
      return 'rap';
    }
    if (cleanGenre.includes('r&b') || cleanGenre.includes('soul')) {
      return 'r&b';
    }
  }
  
  return normalizedGenre || 'rap'; // Default to 'rap' instead of 'other' for this context
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