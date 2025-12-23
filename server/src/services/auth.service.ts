import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export class AuthService {
  async register(data: any) {
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
      },
    });

    // 4. Generate Token
    const token = this.generateToken(newUser);

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, token };
  }

  async login(credentials: any) {
    const { email, password, tenantId, twoFactorToken } = credentials;
    Logger.info('User login attempt', email);

    // 1. Find User
    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Verify Password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // 3. Check if 2FA is enabled
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
        throw new Error('Invalid 2FA token');
      }
    }

    // 4. Generate Token
    const token = this.generateToken(user);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        roles: [], // TODO: Fetch roles
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
}

