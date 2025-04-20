-- CreateTable
CREATE TABLE "ArtistGenreCache" (
    "artistId" TEXT NOT NULL,
    "mainGenres" TEXT[],
    "subGenres" TEXT[],
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistGenreCache_pkey" PRIMARY KEY ("artistId")
);

-- CreateIndex
CREATE INDEX "ArtistGenreCache_lastUpdated_idx" ON "ArtistGenreCache"("lastUpdated");
