# Melodi - Your Musical Journey of Self-Discovery

Melodi is a web application that analyzes your Spotify listening history to help you understand your emotional patterns through music. It provides personalized AI conversations and journal entries based on your musical preferences and listening habits.

## Features

- Spotify integration for music history analysis
- Mood detection based on music metadata (tempo, key, genre)
- AI-powered empathetic conversations about your musical choices
- Weekly journal entries reflecting your emotional journey
- Beautiful visualizations of your mood trends

## Tech Stack

- Frontend: Next.js 14 with TypeScript
- Styling: Tailwind CSS
- Authentication: NextAuth.js with Spotify OAuth
- AI: DeepSeek AI for conversations
- Database: PostgreSQL with Prisma ORM
- Charts: Chart.js

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/melodi.git
   cd melodi
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Spotify API credentials
   - Add your DeepSeek AI API key
   - Configure PostgreSQL connection string

4. Create a Spotify Developer account:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new application
   - Add `http://localhost:3000/api/auth/callback/spotify` to your Redirect URIs
   - Copy the Client ID and Client Secret to your `.env.local` file

5. Set up the database:

   ```bash
   # Create the database
   createdb melodi
   
   # Run Prisma migrations
   npx prisma migrate dev --name init
   ```

6. Run the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `SPOTIFY_CLIENT_ID`: Your Spotify API Client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify API Client Secret
- `NEXTAUTH_URL`: Your application URL (default: http://localhost:3000)
- `NEXTAUTH_SECRET`: A random string for NextAuth.js encryption
- `DEEPSEEK_API_KEY`: Your DeepSeek AI API key
- `DATABASE_URL`: PostgreSQL connection string

## Database Schema

The application uses PostgreSQL with the following main tables:

- `User`: Stores user information and Spotify connection details
- `ListeningHistory`: Tracks user's music listening history with audio features
- `JournalEntry`: Stores AI-generated journal entries and mood summaries

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
