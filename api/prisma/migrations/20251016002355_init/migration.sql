/*
  Warnings:

  - A unique constraint covering the columns `[repoId,number]` on the table `Issue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[githubId]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Issue_repoId_number_key" ON "Issue"("repoId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_githubId_key" ON "Repo"("githubId");
