-- CreateTable
CREATE TABLE "jwtSecret" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jwtSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jwtSecret_version_key" ON "jwtSecret"("version");

-- CreateIndex
CREATE INDEX "jwtSecret_version_idx" ON "jwtSecret"("version");
