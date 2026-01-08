import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/Logger';
import { SessionService } from './session.service';
import { EmailVerificationService } from './emailVerification.service';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const sessionService = new SessionService();
const emailVerificationService = new EmailVerificationService();

export class AuthService {
  async register(data: any, ipAddress?: string, userAgent?: string) {
    const { email, password, tenantId, userName } = data;

    Logger.info('Registering new user', email);

    // 1. Check if user exists in this tenant
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (existingUser) {
      throw new Error('User already exists in this tenant');
    }

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Create User
    const newUser = await prisma.user.create({
      data: {
        email,
        loginId: email, // Defaulting loginId to email
        userName,
        passwordHash,
        tenantId,
        isApproved: true,
        emailVerified: false, // Email not verified yet
      },
    });

    // 4. Send Email Verification
    try {
      await emailVerificationService.sendVerificationEmail(newUser.id, BASE_URL);
      Logger.info('Verification email sent', { userId: newUser.id, email });
    } catch (error: any) {
      Logger.error('Failed to send verification email', {
        error: error.message,
        userId: newUser.id,
      });
      // Don't fail registration if email fails
    }

    // 5. Generate Token
    const token = this.generateToken(newUser);

    // 6. Create Session
    try {
      const sessionToken = await sessionService.createSession({
        userId: newUser.id,
        ipAddress,
        userAgent,
      });
      Logger.info('Session created for new user', { userId: newUser.id, sessionToken: sessionToken.substring(0, 10) + '...' });
    } catch (error: any) {
      Logger.error('Failed to create session', { error: error.message });
      // Don't fail registration if session creation fails
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(credentials: any, ipAddress?: string, userAgent?: string) {
    const { email, password, twoFactorToken } = credentials;
    Logger.info('User login attempt', email);

    // 1. Find User by email (auto-select tenant)
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Check if account is locked
    if (user.isLocked) {
      Logger.warn('Login attempt on locked account', { userId: user.id, email });
      throw new Error('Account is locked due to too many failed login attempts. Please reset your password or contact support.');
    }

    // 3. Check if account is approved
    if (!user.isApproved) {
      Logger.warn('Login attempt on unapproved account', { userId: user.id, email });
      throw new Error('Account is not approved. Please contact your administrator.');
    }

    // 4. Verify Password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      // Increment failed login attempts
      const newAttemptCount = user.passAttemptCount + 1;
      const shouldLock = newAttemptCount >= MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passAttemptCount: newAttemptCount,
          isLocked: shouldLock,
        },
      });

      Logger.warn('Failed login attempt', {
        userId: user.id,
        email,
        attemptCount: newAttemptCount,
        locked: shouldLock,
      });

      if (shouldLock) {
        throw new Error(`Account locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts. Please reset your password.`);
      }

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttemptCount;
      throw new Error(`Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lock.`);
    }

    // 5. Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      if (!twoFactorToken) {
        // Return a special response indicating 2FA is required
        return {
          requires2FA: true,
          message: '2FA token required',
        };
      }

      // Verify 2FA token
      const { TwoFactorService } = await import('./twoFactor.service');
      const twoFactorService = new TwoFactorService();
      const is2FAValid = await twoFactorService.verifyToken(user.id, twoFactorToken);

      if (!is2FAValid) {
        // Increment failed attempts for invalid 2FA
        const newAttemptCount = user.passAttemptCount + 1;
        const shouldLock = newAttemptCount >= MAX_LOGIN_ATTEMPTS;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            passAttemptCount: newAttemptCount,
            isLocked: shouldLock,
          },
        });

        if (shouldLock) {
          throw new Error(`Account locked due to ${MAX_LOGIN_ATTEMPTS} failed attempts. Please reset your password.`);
        }

        throw new Error('Invalid 2FA token');
      }
    }

    // 6. Successful login - Reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passAttemptCount: 0,
        lastLoginTime: new Date(),
      },
    });

    // 7. Generate Token
    const token = this.generateToken(user);

    // 8. Create Session
    let sessionToken: string | null = null;
    try {
      sessionToken = await sessionService.createSession({
        userId: user.id,
        ipAddress,
        userAgent,
      });
      Logger.info('Session created on login', {
        userId: user.id,
        email,
        sessionToken: sessionToken.substring(0, 10) + '...',
      });
    } catch (error: any) {
      Logger.error('Failed to create session on login', {
        error: error.message,
        userId: user.id,
      });
      // Don't fail login if session creation fails
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    Logger.info('Successful login', { userId: user.id, email });

    return {
      user: userWithoutPassword,
      token,
      sessionToken,
      emailVerified: user.emailVerified,
    };
  }

  private generateToken(user: User): string {
    const crypto = require('crypto');
    const jti = crypto.randomUUID(); // Generate unique JWT ID

    return jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        roles: [], // TODO: Fetch roles
        jti, // JWT ID for token blacklisting
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
}

