-- Add phone (nullable, unique) as the primary login identifier.
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Email becomes optional — a user can register with phone only.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Unique index for phone (nullable: multiple NULLs allowed in Postgres).
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
