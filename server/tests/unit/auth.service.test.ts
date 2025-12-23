import { AuthService } from '../../src/services/auth.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('@prisma/client');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService - Unit Tests', () => {
    let authService: AuthService;
    let mockPrisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        authService = new AuthService();
        mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                userName: 'Test User',
                tenantId: 'tenant-123',
                passwordHash: 'hashed-password',
            };

            const registerData = {
                email: 'test@example.com',
                password: 'password123',
                userName: 'Test User',
                tenantId: 'tenant-123',
            };

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

            // Act
            const result = await authService.register(registerData);

            // Assert
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(mockPrisma.user.findUnique).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(mockPrisma.user.create).toHaveBeenCalled();
        });

        it('should throw error if user already exists', async () => {
            // Arrange
            const existingUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

            // Act & Assert
            await expect(
                authService.register({
                    email: 'test@example.com',
                    password: 'password123',
                    tenantId: 'tenant-123',
                })
            ).rejects.toThrow('User already exists');
        });
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                tenantId: 'tenant-123',
                isLocked: false,
                isApproved: true,
                isTwoFactorEnabled: false,
                passAttemptCount: 0,
            };

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

            // Act
            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123',
                tenantId: 'tenant-123',
            });

            // Assert
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
        });

        it('should throw error with invalid credentials', async () => {
            // Arrange
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(
                authService.login({
                    email: 'wrong@example.com',
                    password: 'password123',
                    tenantId: 'tenant-123',
                })
            ).rejects.toThrow('Invalid credentials');
        });

        it('should throw error if account is locked', async () => {
            // Arrange
            const lockedUser = {
                id: 'user-123',
                email: 'test@example.com',
                isLocked: true,
                isApproved: true,
            };

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(lockedUser);

            // Act & Assert
            await expect(
                authService.login({
                    email: 'test@example.com',
                    password: 'password123',
                    tenantId: 'tenant-123',
                })
            ).rejects.toThrow('Account is locked');
        });
    });
});
