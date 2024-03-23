/*
  Warnings:

  - Added the required column `deadline` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "deadline" INTEGER NOT NULL;
