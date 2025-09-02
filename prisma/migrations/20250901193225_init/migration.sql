-- CreateTable
CREATE TABLE "Box" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "boxNumber" TEXT NOT NULL,
    "imagePath" TEXT,
    "items" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Box_boxNumber_key" ON "Box"("boxNumber");
