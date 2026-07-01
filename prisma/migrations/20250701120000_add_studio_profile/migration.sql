-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STUDIO';

-- CreateTable
CREATE TABLE "studio_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "studio_name" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "website" TEXT,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "country" TEXT,
    "city" TEXT,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studio_profiles_user_id_key" ON "studio_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN "studio_id" TEXT;

-- CreateIndex
CREATE INDEX "creator_profiles_studio_id_idx" ON "creator_profiles"("studio_id");

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studio_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "creator_invitations" ADD COLUMN "studio_id" TEXT;

-- CreateIndex
CREATE INDEX "creator_invitations_studio_id_idx" ON "creator_invitations"("studio_id");

-- AddForeignKey
ALTER TABLE "creator_invitations" ADD CONSTRAINT "creator_invitations_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studio_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
