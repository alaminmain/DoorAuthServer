import { AuthService } from '../../src/services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the modules
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Mock PrismaClient
const mockPrismaUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        user: mockPrismaUser,
    })),
}));

describe('AuthService - Unit Tests', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
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

            mockPrismaUser.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            mockPrismaUser.create.mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

            // Act
            const result = await authService.register(registerData);

            // Assert
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(mockPrismaUser.findUnique).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(mockPrismaUser.create).toHaveBeenCalled();
        });

        it('should throw error if user already exists', async () => {
            // Arrange
            const existingUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            mockPrismaUser.findUnique.mockResolvedValue(existingUser);

            // Act & Assert
            await expect(
                authService.register({
                    email: 'test@example.com',
                    password: 'password123',
                    userName: 'Test User',
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
                roles: [],
            };

            mockPrismaUser.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockPrismaUser.update.mockResolvedValue(mockUser);
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
            mockPrismaUser.findUnique.mockResolvedValue(null);

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

            mockPrismaUser.findUnique.mockResolvedValue(lockedUser);

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
