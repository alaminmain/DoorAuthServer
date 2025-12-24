-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT,
    CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "roles_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_roles" ("created_at", "description", "id", "isSystem", "name", "status", "tenantId", "updated_at") SELECT "created_at", "description", "id", "isSystem", "name", "status", "tenantId", "updated_at" FROM "roles";
DROP TABLE "roles";
ALTER TABLE "new_roles" RENAME TO "roles";
CREATE UNIQUE INDEX "roles_tenantId_name_key" ON "roles"("tenantId", "name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
