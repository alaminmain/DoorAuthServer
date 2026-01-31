-- CreateTable
CREATE TABLE "registration_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT,
    "contact" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" DATETIME,
    "verification_token" TEXT,
    "verification_token_expiry" DATETIME,
    "assigned_tenant_id" TEXT,
    "assigned_org_id" TEXT,
    "assigned_by_admin_id" TEXT,
    "assigned_at" DATETIME,
    "approved_by_tenant_admin_id" TEXT,
    "approved_at" DATETIME,
    "rejected_by" TEXT,
    "rejected_at" DATETIME,
    "rejection_reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "registration_requests_assigned_tenant_id_fkey" FOREIGN KEY ("assigned_tenant_id") REFERENCES "tenants" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "registration_requests_assigned_org_id_fkey" FOREIGN KEY ("assigned_org_id") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "lastLoginTime" DATETIME,
    "passAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "isPassExpired" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "registration_request_id" TEXT,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_registration_request_id_fkey" FOREIGN KEY ("registration_request_id") REFERENCES "registration_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("companyAddress", "companyName", "contact", "created_at", "designation", "email", "email_verified", "email_verified_at", "id", "isApproved", "isLocked", "isPassExpired", "isTwoFactorEnabled", "lastLoginTime", "loginId", "organizationId", "passAttemptCount", "passwordHash", "tenantId", "twoFactorSecret", "updated_at", "userName") SELECT "companyAddress", "companyName", "contact", "created_at", "designation", "email", "email_verified", "email_verified_at", "id", "isApproved", "isLocked", "isPassExpired", "isTwoFactorEnabled", "lastLoginTime", "loginId", "organizationId", "passAttemptCount", "passwordHash", "tenantId", "twoFactorSecret", "updated_at", "userName" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_registration_request_id_key" ON "users"("registration_request_id");
CREATE INDEX "users_isApproved_idx" ON "users"("isApproved");
CREATE UNIQUE INDEX "users_tenantId_loginId_key" ON "users"("tenantId", "loginId");
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "registration_requests_email_key" ON "registration_requests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "registration_requests_verification_token_key" ON "registration_requests"("verification_token");

-- CreateIndex
CREATE INDEX "registration_requests_status_idx" ON "registration_requests"("status");

-- CreateIndex
CREATE INDEX "registration_requests_emailVerified_idx" ON "registration_requests"("emailVerified");

-- CreateIndex
CREATE INDEX "registration_requests_assigned_tenant_id_idx" ON "registration_requests"("assigned_tenant_id");

-- CreateIndex
CREATE INDEX "registration_requests_created_at_idx" ON "registration_requests"("created_at");
