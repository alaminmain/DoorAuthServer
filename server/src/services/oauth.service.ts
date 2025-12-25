import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const AUTH_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export class OAuthService {
    /**
     * Generate authorization code (Step 1 of OAuth flow)
     */
    async generateAuthorizationCode(params: {
        clientId: string;
        userId: string;
        redirectUri: string;
        scope?: string;
        codeChallenge?: string;
        codeChallengeMethod?: string;
    }) {
        const { clientId, userId, redirectUri, scope, codeChallenge, codeChallengeMethod } = params;

        Logger.info('Generating authorization code', { clientId, userId });

        // Verify application exists
        const application = await prisma.application.findUnique({
            where: { clientId },
        });

        if (!application) {
            throw new Error('Invalid client_id');
        }

        // Verify redirect URI matches registered URIs
        const registeredUris = application.redirectUris.split(',').map(uri => uri.trim());
        if (!registeredUris.includes(redirectUri)) {
            throw new Error('Invalid redirect_uri');
        }

        // Generate authorization code
        const code = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + AUTH_CODE_EXPIRY);

        await prisma.authorizationCode.create({
            data: {
                code,
                clientId,
                userId,
                redirectUri,
                scope,
                codeChallenge,
                codeChallengeMethod,
                expiresAt,
            },
        });

        Logger.info('Authorization code generated', { code: code.substring(0, 10) + '...' });

        return { code, expiresIn: AUTH_CODE_EXPIRY / 1000 };
    }

    /**
     * Exchange authorization code for access token (Step 2 of OAuth flow)
     */
    async exchangeCodeForToken(params: {
        code: string;
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        codeVerifier?: string;
    }) {
        const { code, clientId, clientSecret, redirectUri, codeVerifier } = params;

        Logger.info('Exchanging authorization code for token', { clientId });

        // Verify application
        const application = await prisma.application.findUnique({
            where: { clientId },
        });

        if (!application || application.clientSecret !== clientSecret) {
            throw new Error('Invalid client credentials');
        }

        // Find authorization code
        const authCode = await prisma.authorizationCode.findUnique({
            where: { code },
        });

        if (!authCode) {
            throw new Error('Invalid authorization code');
        }

        // Verify code hasn't been used
        if (authCode.used) {
            throw new Error('Authorization code already used');
        }

        // Verify code hasn't expired
        if (new Date() > authCode.expiresAt) {
            throw new Error('Authorization code expired');
        }

        // Verify client ID matches
        if (authCode.clientId !== clientId) {
            throw new Error('Client ID mismatch');
        }

        // Verify redirect URI matches
        if (authCode.redirectUri !== redirectUri) {
            throw new Error('Redirect URI mismatch');
        }

        // Verify PKCE if code_challenge was provided
        if (authCode.codeChallenge) {
            if (!codeVerifier) {
                throw new Error('Code verifier required for PKCE');
            }

            const computedChallenge = this.generateCodeChallenge(codeVerifier, authCode.codeChallengeMethod || 'S256');
            if (computedChallenge !== authCode.codeChallenge) {
                throw new Error('Invalid code verifier');
            }
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: authCode.userId },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Mark code as used
        await prisma.authorizationCode.update({
            where: { code },
            data: {
                used: true,
                usedAt: new Date(),
            },
        });

        // Generate access token
        const accessToken = jwt.sign(
            {
                userId: user.id,
                tenantId: user.tenantId,
                email: user.email,
                roles: user.roles.map(ur => ur.role.name),
                permissions: user.roles.flatMap(ur =>
                    ur.role.permissions.map(p => `${p.resource}:${p.action}`)
                ),
                type: 'access_token',
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Generate ID token for OpenID Connect
        const idToken = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                email_verified: user.isApproved,
                name: user.userName,
                preferred_username: user.loginId,
                aud: clientId,
                iss: process.env.ISSUER_URL || 'http://localhost:3000',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
            },
            JWT_SECRET
        );

        // Generate refresh token
        const refreshToken = crypto.randomBytes(32).toString('hex');
        const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                clientId,
                scope: authCode.scope,
                expiresAt: refreshExpiresAt,
            },
        });

        Logger.info('Tokens generated successfully', { userId: user.id });

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: refreshToken,
            id_token: idToken,
            scope: authCode.scope,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(params: {
        refreshToken: string;
        clientId: string;
        clientSecret: string;
    }) {
        const { refreshToken, clientId, clientSecret } = params;

        Logger.info('Refreshing access token', { clientId });

        // Verify application
        const application = await prisma.application.findUnique({
            where: { clientId },
        });

        if (!application || application.clientSecret !== clientSecret) {
            throw new Error('Invalid client credentials');
        }

        // Find refresh token
        const token = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!token) {
            throw new Error('Invalid refresh token');
        }

        // Verify token hasn't been revoked
        if (token.revoked) {
            throw new Error('Refresh token has been revoked');
        }

        // Verify token hasn't expired
        if (new Date() > token.expiresAt) {
            throw new Error('Refresh token expired');
        }

        // Verify client ID matches
        if (token.clientId !== clientId) {
            throw new Error('Client ID mismatch');
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: token.userId },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                userId: user.id,
                tenantId: user.tenantId,
                email: user.email,
                roles: user.roles.map(ur => ur.role.name),
                permissions: user.roles.flatMap(ur =>
                    ur.role.permissions.map(p => `${p.resource}:${p.action}`)
                ),
                type: 'access_token',
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        Logger.info('Access token refreshed', { userId: user.id });

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: token.scope,
        };
    }

    /**
     * Revoke refresh token
     */
    async revokeRefreshToken(refreshToken: string) {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: {
                revoked: true,
                revokedAt: new Date(),
            },
        });

        Logger.info('Refresh token revoked');
    }

    /**
     * Generate PKCE code challenge
     */
    private generateCodeChallenge(verifier: string, method: string): string {
        if (method === 'S256') {
            return crypto.createHash('sha256').update(verifier).digest('base64url');
        } else if (method === 'plain') {
            return verifier;
        }
        throw new Error('Unsupported code challenge method');
    }
}
