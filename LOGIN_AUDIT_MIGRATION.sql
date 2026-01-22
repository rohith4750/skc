-- =====================================================
-- LOGIN AUDIT TABLE MIGRATION
-- Run this SQL on your production database to add the
-- login_audit_logs table for tracking user login activity
-- =====================================================

-- Create the login_audit_logs table
CREATE TABLE IF NOT EXISTS "login_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "loginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "location" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failReason" TEXT,

    CONSTRAINT "login_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint to users table
ALTER TABLE "login_audit_logs" 
ADD CONSTRAINT "login_audit_logs_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "login_audit_logs_userId_idx" ON "login_audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "login_audit_logs_loginTime_idx" ON "login_audit_logs"("loginTime");
CREATE INDEX IF NOT EXISTS "login_audit_logs_success_idx" ON "login_audit_logs"("success");

-- =====================================================
-- INSTRUCTIONS:
-- 1. Connect to your PostgreSQL database
-- 2. Run this entire script
-- 3. The login_audit_logs table will be created
-- 4. All user logins will now be tracked automatically
-- =====================================================

