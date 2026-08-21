/*
  Warnings:

  - Made the column `organizationId` on table `Agreement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `AgreementTemplate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Approval` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `CompanyProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Division` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `DocumentRegistry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Expense` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `GalleryCollection` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Personnel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Quotation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `SecurityEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `StandaloneAgreement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `StandaloneAgreementTemplate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Task` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `WebsiteGallery` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `WorkflowEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Agreement" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "AgreementTemplate" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Approval" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CompanyProfile" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Division" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DocumentCounter" ALTER COLUMN "organizationId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DocumentRegistry" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "GalleryCollection" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Personnel" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Quotation" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SecurityEvent" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StandaloneAgreement" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StandaloneAgreementTemplate" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WebsiteGallery" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowEvent" ALTER COLUMN "organizationId" SET NOT NULL;
