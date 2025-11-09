-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "login" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repo" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "labels" TEXT[],
    "points" INTEGER,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
