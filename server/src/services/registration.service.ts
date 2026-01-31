/**
 * Registration Service
 * Handles the three-tier registration workflow:
 * 1. User Self-Registration (creates RegistrationRequest)
 * 2. Admin Tenant Assignment (creates User, assigns to Tenant)
 * 3. Tenant Admin Role Assignment (approves User, assigns Roles)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Logger } from '../utils/Logger';
import { EmailService } from './email.service';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const BASE_URL = process.env.BASE_URL || 'https://localhost:3000';
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// Registration Status constants (SQLite doesn't support enums)
export const RegistrationStatus = {
    PENDING: 'PENDING',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',
    TENANT_ASSIGNED: 'TENANT_ASSIGNED',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED',
} as const;

export type RegistrationStatusType = typeof RegistrationStatus[keyof typeof RegistrationStatus];

export class RegistrationService {
    private emailService = new EmailService();

    /**
     * PHASE 1: Create registration request (public endpoint)
     * Creates a pending registration request and sends verification email
     */
    async createRegistrationRequest(
        data: {
            email: string;
            password: string;
            fullName: string;
            companyName?: string;
            contact?: string;
        },
        metadata: {
            ipAddress?: string;
            userAgent?: string;
        }
    ) {
        const { email, password, fullName, companyName, contact } = data;
        const { ipAddress, userAgent } = metadata;

        Logger.info('Creating registration request', { email, fullName });

        // Check if email already exists in registration requests
        const existingRequest = await prisma.registrationRequest.findUnique({
            where: { email },
        });

        if (existingRequest) {
            if (existingRequest.status === RegistrationStatus.REJECTED) {
                // Allow re-registration if previous request was rejected
                Logger.info('Deleting rejected registration request for new attempt', { email });
                await prisma.registrationRequest.delete({ where: { id: existingRequest.id } });
            } else if (existingRequest.status === RegistrationStatus.EXPIRED) {
                // Allow re-registration if previous request expired
                Logger.info('Deleting expired registration request for new attempt', { email });
                await prisma.registrationRequest.delete({ where: { id: existingRequest.id } });
            } else {
                throw new Error('A registration request with this email already exists. Please check your email for verification link or contact support.');
            }
        }

        // Check if email already exists in users
        const existingUser = await prisma.user.findFirst({
            where: { email },
        });

        if (existingUser) {
            throw new Error('An account with this email already exists. Please login or use password recovery.');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        // Create registration request
        const request = await prisma.registrationRequest.create({
            data: {
                email,
                fullName,
                companyName,
                contact,
                passwordHash,
                status: RegistrationStatus.PENDING,
                verificationToken,
                verificationTokenExpiry,
                ipAddress,
                userAgent,
            },
        });

        Logger.info('Registration request created', { requestId: request.id, email });

        // Send verification email
        try {
            await this.sendVerificationEmail(request.email, verificationToken, fullName);
            Logger.info('Verification email sent', { requestId: request.id, email });
        } catch (error: any) {
            Logger.error('Failed to send verification email', {
                error: error.message,
                requestId: request.id,
            });
            // Don't fail registration if email fails - user can request resend
        }

        return {
            requestId: request.id,
            email: request.email,
            status: request.status,
            message: 'Registration request created successfully. Please check your email to verify your account.',
        };
    }

    /**
     * Send verification email
     */
    private async sendVerificationEmail(email: string, token: string, fullName: string) {
        const verificationUrl = `${BASE_URL}/verify-registration?token=${token}`;

        await this.emailService.sendEmail({
            to: email,
            subject: 'Verify Your Email - DoorAuth Registration',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to DoorAuth!</h1>
          <p>Hello ${fullName},</p>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
          <p>This link will expire in ${VERIFICATION_TOKEN_EXPIRY_HOURS} hours.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            After email verification, an administrator will review your registration and assign you to the appropriate tenant.
            You will receive another email once your account is fully activated.
          </p>
        </div>
      `,
        });
    }

    /**
     * Verify email from registration request
     */
    async verifyRegistrationEmail(token: string) {
        Logger.info('Verifying registration email', { tokenPrefix: token.substring(0, 10) });

        const request = await prisma.registrationRequest.findUnique({
            where: { verificationToken: token },
        });

        if (!request) {
            throw new Error('Invalid verification token. Please request a new verification email.');
        }

        if (request.emailVerified) {
            return {
                message: 'Email already verified. Your registration is pending admin approval.',
                status: request.status,
            };
        }

        if (request.verificationTokenExpiry && new Date() > request.verificationTokenExpiry) {
            throw new Error('Verification token has expired. Please request a new verification email.');
        }

        if (request.status === RegistrationStatus.REJECTED) {
            throw new Error('This registration request has been rejected.');
        }

        // Update registration request
        const updatedRequest = await prisma.registrationRequest.update({
            where: { id: request.id },
            data: {
                emailVerified: true,
                emailVerifiedAt: new Date(),
                status: RegistrationStatus.EMAIL_VERIFIED,
                verificationToken: null, // Clear token after use
            },
        });

        Logger.info('Registration email verified', { requestId: request.id, email: request.email });

        return {
            requestId: updatedRequest.id,
            email: updatedRequest.email,
            status: updatedRequest.status,
            message: 'Email verified successfully. Your registration is now pending admin approval.',
        };
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email: string) {
        const request = await prisma.registrationRequest.findUnique({
            where: { email },
        });

        if (!request) {
            throw new Error('No registration request found for this email.');
        }

        if (request.emailVerified) {
            throw new Error('Email already verified. Your registration is pending admin approval.');
        }

        if (request.status === RegistrationStatus.REJECTED) {
            throw new Error('This registration request has been rejected. Please register again.');
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        await prisma.registrationRequest.update({
            where: { id: request.id },
            data: {
                verificationToken,
                verificationTokenExpiry,
            },
        });

        // Send verification email
        await this.sendVerificationEmail(request.email, verificationToken, request.fullName);

        Logger.info('Verification email resent', { requestId: request.id, email: request.email });

        return {
            message: 'Verification email sent. Please check your inbox.',
        };
    }

    /**
     * Get registration status (public, for user to check their status)
     */
    async getRegistrationStatus(requestId: string) {
        const request = await prisma.registrationRequest.findUnique({
            where: { id: requestId },
            include: {
                tenant: { select: { name: true } },
            },
        });

        if (!request) {
            throw new Error('Registration request not found.');
        }

        let message: string;
        switch (request.status) {
            case RegistrationStatus.PENDING:
                message = 'Please verify your email to continue the registration process.';
                break;
            case RegistrationStatus.EMAIL_VERIFIED:
                message = 'Your email is verified. Your registration is pending admin approval.';
                break;
            case RegistrationStatus.TENANT_ASSIGNED:
                message = `You have been assigned to ${request.tenant?.name || 'a tenant'}. Your registration is pending role assignment by your tenant administrator.`;
                break;
            case RegistrationStatus.COMPLETED:
                message = 'Your registration is complete! You can now log in.';
                break;
            case RegistrationStatus.REJECTED:
                message = `Your registration was rejected. ${request.rejectionReason ? `Reason: ${request.rejectionReason}` : 'Please contact support for more information.'}`;
                break;
            case RegistrationStatus.EXPIRED:
                message = 'Your registration request has expired. Please register again.';
                break;
            default:
                message = 'Unknown status.';
        }

        return {
            requestId: request.id,
            email: request.email,
            status: request.status,
            emailVerified: request.emailVerified,
            tenantName: request.tenant?.name,
            createdAt: request.createdAt,
            message,
        };
    }

    /**
     * PHASE 2: Admin assigns tenant to registration request
     * Creates User record and updates registration status
     */
    async assignTenantToRequest(
        requestId: string,
        adminUserId: string,
        assignment: {
            tenantId: string;
            organizationId?: string;
        }
    ) {
        Logger.info('Admin assigning tenant to registration request', {
            requestId,
            adminUserId,
            tenantId: assignment.tenantId,
        });

        // Get registration request
        const request = await prisma.registrationRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw new Error('Registration request not found.');
        }

        if (!request.emailVerified) {
            throw new Error('Email must be verified before tenant assignment. Ask the user to verify their email first.');
        }

        if (request.status === RegistrationStatus.REJECTED) {
            throw new Error('This registration request has been rejected.');
        }

        if (request.status === RegistrationStatus.TENANT_ASSIGNED || request.status === RegistrationStatus.COMPLETED) {
            throw new Error('Tenant has already been assigned to this registration request.');
        }

        // Verify tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: assignment.tenantId },
        });

        if (!tenant) {
            throw new Error('Tenant not found.');
        }

        // Verify organization exists (if provided)
        if (assignment.organizationId) {
            const org = await prisma.organization.findFirst({
                where: {
                    id: assignment.organizationId,
                    tenantId: assignment.tenantId,
                },
            });

            if (!org) {
                throw new Error('Organization not found or does not belong to the specified tenant.');
            }
        }

        // Check if email already exists in this tenant
        const existingUser = await prisma.user.findFirst({
            where: {
                email: request.email,
                tenantId: assignment.tenantId,
            },
        });

        if (existingUser) {
            throw new Error('A user with this email already exists in the specified tenant.');
        }

        // Create user record (not approved yet)
        const user = await prisma.user.create({
            data: {
                email: request.email,
                loginId: request.email,
                userName: request.fullName,
                passwordHash: request.passwordHash,
                companyName: request.companyName,
                contact: request.contact,
                tenantId: assignment.tenantId,
                organizationId: assignment.organizationId,
                isApproved: false, // Will be approved by Tenant Admin in Phase 3
                emailVerified: true,
                emailVerifiedAt: request.emailVerifiedAt,
                registrationRequestId: request.id,
            },
        });

        // Update registration request
        await prisma.registrationRequest.update({
            where: { id: requestId },
            data: {
                status: RegistrationStatus.TENANT_ASSIGNED,
                assignedTenantId: assignment.tenantId,
                assignedOrgId: assignment.organizationId,
                assignedByAdminId: adminUserId,
                assignedAt: new Date(),
            },
        });

        Logger.info('User created and tenant assigned', {
            userId: user.id,
            tenantId: assignment.tenantId,
            tenantName: tenant.name,
        });

        // TODO: Send notification to Tenant Admins
        // await this.notifyTenantAdmins(assignment.tenantId, user);

        return {
            userId: user.id,
            email: user.email,
            tenantId: assignment.tenantId,
            tenantName: tenant.name,
            organizationId: assignment.organizationId,
            status: RegistrationStatus.TENANT_ASSIGNED,
            message: `User created and assigned to tenant "${tenant.name}". Tenant admin can now assign roles and approve the user.`,
        };
    }

    /**
     * PHASE 3: Tenant Admin approves user and assigns roles
     */
    async approveUserAndAssignRoles(
        userId: string,
        tenantAdminId: string,
        assignment: {
            roleIds: string[];
            organizationId?: string;
        }
    ) {
        Logger.info('Tenant admin approving user', {
            userId,
            tenantAdminId,
            roleIds: assignment.roleIds,
        });

        // Get user with tenant
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenant: { select: { name: true } },
                registrationRequest: true,
            },
        });

        if (!user) {
            throw new Error('User not found.');
        }

        if (user.isApproved) {
            throw new Error('User is already approved.');
        }

        if (!user.tenantId) {
            throw new Error('User is not assigned to a tenant yet.');
        }

        // Verify tenant admin belongs to the same tenant
        const tenantAdmin = await prisma.user.findUnique({
            where: { id: tenantAdminId },
        });

        if (!tenantAdmin || tenantAdmin.tenantId !== user.tenantId) {
            throw new Error('You can only approve users in your own tenant.');
        }

        if (assignment.roleIds.length === 0) {
            throw new Error('At least one role must be assigned.');
        }

        // Verify roles belong to the same tenant
        const roles = await prisma.role.findMany({
            where: {
                id: { in: assignment.roleIds },
                tenantId: user.tenantId,
            },
        });

        if (roles.length !== assignment.roleIds.length) {
            throw new Error('One or more roles are invalid or do not belong to this tenant.');
        }

        // Update organization if provided
        let finalOrgId = user.organizationId;
        if (assignment.organizationId) {
            const org = await prisma.organization.findFirst({
                where: {
                    id: assignment.organizationId,
                    tenantId: user.tenantId,
                },
            });

            if (!org) {
                throw new Error('Organization not found or does not belong to this tenant.');
            }
            finalOrgId = assignment.organizationId;
        }

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: true,
                approvedBy: tenantAdminId,
                approvedAt: new Date(),
                organizationId: finalOrgId,
            },
        });

        // Assign roles (use loop to handle duplicates gracefully)
        for (const roleId of assignment.roleIds) {
            try {
                await prisma.userRole.create({
                    data: {
                        userId,
                        roleId,
                    },
                });
            } catch (error: any) {
                // Ignore duplicate key errors
                if (!error.message?.includes('Unique constraint')) {
                    throw error;
                }
            }
        }

        // Update registration request
        if (user.registrationRequestId) {
            await prisma.registrationRequest.update({
                where: { id: user.registrationRequestId },
                data: {
                    status: RegistrationStatus.COMPLETED,
                    approvedByTenantAdminId: tenantAdminId,
                    approvedAt: new Date(),
                },
            });
        }

        Logger.info('User approved successfully', {
            userId: user.id,
            email: user.email,
            roles: roles.map((r) => r.name),
        });

        // Send welcome email
        try {
            await this.sendWelcomeEmail(user.email, user.userName || user.email, user.tenant?.name || 'your organization');
        } catch (error: any) {
            Logger.error('Failed to send welcome email', { error: error.message, userId });
        }

        return {
            userId: user.id,
            email: user.email,
            isApproved: true,
            tenantName: user.tenant?.name,
            roles: roles.map((r) => ({ id: r.id, name: r.name })),
            message: 'User approved successfully. Welcome email sent.',
        };
    }

    /**
     * Send welcome email after approval
     */
    private async sendWelcomeEmail(email: string, name: string, tenantName: string) {
        const loginUrl = `${BASE_URL}/login`;

        await this.emailService.sendEmail({
            to: email,
            subject: 'Your Account Has Been Approved - DoorAuth',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">🎉 Account Approved!</h1>
          <p>Hello ${name},</p>
          <p>Great news! Your account has been approved and you now have access to <strong>${tenantName}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Login Now
            </a>
          </div>
          <p>If you have any questions, please contact your administrator.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by DoorAuth. If you did not register for an account, please contact support.
          </p>
        </div>
      `,
        });
    }

    /**
     * Reject registration request (Admin or Tenant Admin)
     */
    async rejectRegistrationRequest(
        requestId: string,
        rejectedBy: string,
        reason: string
    ) {
        Logger.info('Rejecting registration request', { requestId, rejectedBy, reason });

        const request = await prisma.registrationRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw new Error('Registration request not found.');
        }

        if (request.status === RegistrationStatus.COMPLETED) {
            throw new Error('Cannot reject a completed registration. The user must be deleted separately.');
        }

        if (request.status === RegistrationStatus.REJECTED) {
            throw new Error('This registration request has already been rejected.');
        }

        // Update registration request
        await prisma.registrationRequest.update({
            where: { id: requestId },
            data: {
                status: RegistrationStatus.REJECTED,
                rejectedBy,
                rejectedAt: new Date(),
                rejectionReason: reason,
            },
        });

        // Delete associated user if exists
        const user = await prisma.user.findFirst({
            where: { registrationRequestId: requestId },
        });

        if (user) {
            await prisma.user.delete({ where: { id: user.id } });
            Logger.info('Associated user deleted', { userId: user.id });
        }

        Logger.info('Registration request rejected', { requestId, reason });

        // Send rejection email
        try {
            await this.sendRejectionEmail(request.email, request.fullName, reason);
        } catch (error: any) {
            Logger.error('Failed to send rejection email', { error: error.message, requestId });
        }

        return {
            message: 'Registration request rejected successfully.',
        };
    }

    /**
     * Send rejection email
     */
    private async sendRejectionEmail(email: string, name: string, reason: string) {
        await this.emailService.sendEmail({
            to: email,
            subject: 'Registration Request Update - DoorAuth',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Registration Update</h1>
          <p>Hello ${name},</p>
          <p>We regret to inform you that your registration request has not been approved.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you believe this was a mistake or would like more information, please contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by DoorAuth.
          </p>
        </div>
      `,
        });
    }

    /**
     * Get pending registration requests (System Admin)
     */
    async getPendingRequests(filters?: {
        status?: string;
        emailVerified?: boolean;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.emailVerified !== undefined) {
            where.emailVerified = filters.emailVerified;
        }

        const [requests, total] = await Promise.all([
            prisma.registrationRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: { select: { id: true, name: true } },
                    organization: { select: { id: true, name: true } },
                },
                skip,
                take: limit,
            }),
            prisma.registrationRequest.count({ where }),
        ]);

        Logger.info('Fetched pending registration requests', { count: requests.length, total });

        return {
            requests: requests.map((r) => ({
                id: r.id,
                email: r.email,
                fullName: r.fullName,
                companyName: r.companyName,
                contact: r.contact,
                status: r.status,
                emailVerified: r.emailVerified,
                emailVerifiedAt: r.emailVerifiedAt,
                tenant: r.tenant,
                organization: r.organization,
                assignedAt: r.assignedAt,
                createdAt: r.createdAt,
                ipAddress: r.ipAddress,
                userAgent: r.userAgent,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get pending users for tenant (Tenant Admin)
     */
    async getPendingUsersForTenant(tenantId: string) {
        const users = await prisma.user.findMany({
            where: {
                tenantId,
                isApproved: false,
            },
            include: {
                organization: { select: { id: true, name: true } },
                registrationRequest: {
                    select: {
                        id: true,
                        createdAt: true,
                        assignedByAdminId: true,
                        assignedAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        Logger.info('Fetched pending users for tenant', { tenantId, count: users.length });

        return {
            users: users.map((u) => ({
                id: u.id,
                email: u.email,
                userName: u.userName,
                companyName: u.companyName,
                contact: u.contact,
                organization: u.organization,
                createdAt: u.createdAt,
                registrationRequest: u.registrationRequest,
            })),
        };
    }

    /**
     * Get available roles for a tenant (for role assignment dropdown)
     */
    async getAvailableRolesForTenant(tenantId: string) {
        const roles = await prisma.role.findMany({
            where: {
                tenantId,
                status: 'active',
            },
            select: {
                id: true,
                name: true,
                description: true,
                isSystem: true,
            },
            orderBy: { name: 'asc' },
        });

        return { roles };
    }

    /**
     * Get available tenants (for Admin tenant assignment dropdown)
     */
    async getAvailableTenants() {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                domain: true,
            },
            orderBy: { name: 'asc' },
        });

        return { tenants };
    }

    /**
     * Get organizations for a tenant (for organization assignment dropdown)
     */
    async getOrganizationsForTenant(tenantId: string) {
        const organizations = await prisma.organization.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                level: true,
                parentId: true,
            },
            orderBy: { name: 'asc' },
        });

        return { organizations };
    }
}
