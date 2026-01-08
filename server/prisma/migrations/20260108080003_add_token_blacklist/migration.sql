-- CreateTable
CREATE TABLE "token_blacklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "token" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "revoked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "revokedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "token_blacklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "token_blacklist_jti_key" ON "token_blacklist"("jti");

-- CreateIndex
CREATE INDEX "token_blacklist_jti_idx" ON "token_blacklist"("jti");

-- CreateIndex
CREATE INDEX "token_blacklist_userId_idx" ON "token_blacklist"("userId");

-- CreateIndex
CREATE INDEX "token_blacklist_expiresAt_idx" ON "token_blacklist"("expiresAt");

-- CreateIndex
CREATE INDEX "token_blacklist_tokenType_idx" ON "token_blacklist"("tokenType");
