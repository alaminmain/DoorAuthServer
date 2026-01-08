-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "organizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizations" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loginId" TEXT NOT NULL,
    "userName" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "designation" TEXT,
    "contact" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "lastLoginTime" DATETIME,
    "passAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "isPassExpired" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("companyAddress", "companyName", "contact", "created_at", "designation", "email", "id", "isApproved", "isLocked", "isPassExpired", "isTwoFactorEnabled", "lastLoginTime", "loginId", "passAttemptCount", "passwordHash", "tenantId", "twoFactorSecret", "updated_at", "userName") SELECT "companyAddress", "companyName", "contact", "created_at", "designation", "email", "id", "isApproved", "isLocked", "isPassExpired", "isTwoFactorEnabled", "lastLoginTime", "loginId", "passAttemptCount", "passwordHash", "tenantId", "twoFactorSecret", "updated_at", "userName" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_tenantId_loginId_key" ON "users"("tenantId", "loginId");
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
