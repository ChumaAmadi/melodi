-- AlterTable
ALTER TABLE "ListeningHistory" ADD COLUMN     "genre" TEXT,
ADD COLUMN     "subGenres" TEXT[];

-- CreateTable
CREATE TABLE "GenreMoodCorrelation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenreMoodCorrelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenreMoodCorrelation_userId_idx" ON "GenreMoodCorrelation"("userId");

-- CreateIndex
CREATE INDEX "GenreMoodCorrelation_genre_idx" ON "GenreMoodCorrelation"("genre");

-- CreateIndex
CREATE INDEX "GenreMoodCorrelation_mood_idx" ON "GenreMoodCorrelation"("mood");

-- CreateIndex
CREATE UNIQUE INDEX "GenreMoodCorrelation_userId_genre_mood_key" ON "GenreMoodCorrelation"("userId", "genre", "mood");

-- CreateIndex
CREATE INDEX "ListeningHistory_genre_idx" ON "ListeningHistory"("genre");

-- AddForeignKey
ALTER TABLE "GenreMoodCorrelation" ADD CONSTRAINT "GenreMoodCorrelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
