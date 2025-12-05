-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "duration" INTEGER;

-- CreateTable
CREATE TABLE "VideoWatchProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER,
    "percentWatched" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastWatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoWatchProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoWatchProgress_userId_lastWatchedAt_idx" ON "VideoWatchProgress"("userId", "lastWatchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoWatchProgress_userId_videoId_key" ON "VideoWatchProgress"("userId", "videoId");

-- AddForeignKey
ALTER TABLE "VideoWatchProgress" ADD CONSTRAINT "VideoWatchProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoWatchProgress" ADD CONSTRAINT "VideoWatchProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
