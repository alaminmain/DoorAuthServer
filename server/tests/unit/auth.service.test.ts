import { AuthService } from '../../src/services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the modules
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Create mock functions first
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

// Mock PrismaClient with inline functions
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        user: {
            findUnique: mockFindUnique,
            create: mockCreate,
            update: mockUpdate,
        },
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

            mockFindUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            mockCreate.mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

            // Act
            const result = await authService.register(registerData);

            // Assert
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(mockFindUnique).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(mockCreate).toHaveBeenCalled();
        });

        it('should throw error if user already exists', async () => {
            // Arrange
            const existingUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            mockFindUnique.mockResolvedValue(existingUser);

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

            mockFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockUpdate.mockResolvedValue(mockUser);
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
            mockFindUnique.mockResolvedValue(null);

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

            mockFindUnique.mockResolvedValue(lockedUser);

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
