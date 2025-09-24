-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Box" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "boxNumber" TEXT NOT NULL,
    "images" TEXT,
    "items" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "mainImageIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Box" ("boxNumber", "createdAt", "id", "images", "items", "keywords", "updatedAt") SELECT "boxNumber", "createdAt", "id", "images", "items", "keywords", "updatedAt" FROM "Box";
DROP TABLE "Box";
ALTER TABLE "new_Box" RENAME TO "Box";
CREATE UNIQUE INDEX "Box_boxNumber_key" ON "Box"("boxNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
