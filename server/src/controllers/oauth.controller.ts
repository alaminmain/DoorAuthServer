import { Request, Response } from 'express';
import { OAuthService } from '../services/oauth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { PrismaClient } from '@prisma/client';

const oauthService = new OAuthService();
const prisma = new PrismaClient();

export class OAuthController {
    /**
     * OAuth Authorization Endpoint
     * GET /oauth/authorize
     */
    async authorize(req: Request, res: Response) {
        try {
            const {
                response_type,
                client_id,
                redirect_uri,
                scope,
                state,
                code_challenge,
                code_challenge_method,
            } = req.query;

            // Validate required parameters
            if (!response_type || !client_id || !redirect_uri) {
                res.status(400).json(ApiResponse.error('Missing required parameters: response_type, client_id, redirect_uri'));
                return;
            }

            // Only support authorization code flow
            if (response_type !== 'code') {
                res.status(400).json(ApiResponse.error('Unsupported response_type. Only "code" is supported.'));
                return;
            }

            // Check if user is authenticated
            const user = (req as any).user;
            if (!user) {
                // Redirect to login page
                const loginUrl = new URL('http://localhost:5173/login');
                const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
                loginUrl.searchParams.append('returnUrl', fullUrl);
                res.redirect(loginUrl.toString());
                return;
            }

            // Generate authorization code
            const result = await oauthService.generateAuthorizationCode({
                clientId: client_id as string,
                userId: user.userId,
                redirectUri: redirect_uri as string,
                scope: scope as string,
                codeChallenge: code_challenge as string,
                codeChallengeMethod: code_challenge_method as string || 'S256',
            });



            // Perform actual redirect
            const redirectUrl = new URL(redirect_uri as string);
            redirectUrl.searchParams.append('code', result.code);
            if (state) {
                redirectUrl.searchParams.append('state', state as string);
            }

            res.redirect(redirectUrl.toString());
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * OAuth Token Endpoint
     * POST /oauth/token
     */
    async token(req: Request, res: Response) {
        try {
            const {
                grant_type,
                code,
                redirect_uri,
                client_id,
                client_secret,
                refresh_token,
                code_verifier,
            } = req.body;

            // Validate required parameters
            if (!grant_type || !client_id || !client_secret) {
                res.status(400).json(ApiResponse.error('Missing required parameters: grant_type, client_id, client_secret'));
                return;
            }

            let tokenResponse;

            if (grant_type === 'authorization_code') {
                // Exchange authorization code for tokens
                if (!code || !redirect_uri) {
                    res.status(400).json(ApiResponse.error('Missing required parameters: code, redirect_uri'));
                    return;
                }

                tokenResponse = await oauthService.exchangeCodeForToken({
                    code,
                    clientId: client_id,
                    clientSecret: client_secret,
                    redirectUri: redirect_uri,
                    codeVerifier: code_verifier,
                });
            } else if (grant_type === 'refresh_token') {
                // Refresh access token
                if (!refresh_token) {
                    res.status(400).json(ApiResponse.error('Missing required parameter: refresh_token'));
                    return;
                }

                tokenResponse = await oauthService.refreshAccessToken({
                    refreshToken: refresh_token,
                    clientId: client_id,
                    clientSecret: client_secret,
                });
            } else {
                res.status(400).json(ApiResponse.error('Unsupported grant_type. Supported types: authorization_code, refresh_token'));
                return;
            }

            res.status(200).json(tokenResponse);
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * OIDC UserInfo Endpoint
     * GET /oauth/userinfo
     */
    async userinfo(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) {
                res.status(401).json(ApiResponse.error('Unauthorized'));
                return;
            }

            // Get full user details
            const userRecord = await prisma.user.findUnique({
                where: { id: user.userId },
                select: {
                    id: true,
                    email: true,
                    userName: true,
                    companyName: true,
                    designation: true,
                    contact: true,
                    tenantId: true,
                    lastLoginTime: true,
                    isTwoFactorEnabled: true,
                },
            });

            if (!userRecord) {
                res.status(404).json(ApiResponse.error('User not found'));
                return;
            }

            // Return OIDC standard claims
            res.status(200).json({
                sub: userRecord.id,
                email: userRecord.email,
                email_verified: true,
                name: userRecord.userName,
                preferred_username: userRecord.email,
                tenant_id: userRecord.tenantId,
                company: userRecord.companyName,
                job_title: userRecord.designation,
                phone_number: userRecord.contact,
                updated_at: userRecord.lastLoginTime?.getTime() || null,
            });
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Revoke Token Endpoint
     * POST /oauth/revoke
     */
    async revoke(req: Request, res: Response) {
        try {
            const { token, token_type_hint } = req.body;

            if (!token) {
                res.status(400).json(ApiResponse.error('Missing required parameter: token'));
                return;
            }

            // Only support refresh token revocation for now
            if (token_type_hint && token_type_hint !== 'refresh_token') {
                res.status(400).json(ApiResponse.error('Only refresh_token revocation is supported'));
                return;
            }

            await oauthService.revokeRefreshToken(token);

            res.status(200).json(ApiResponse.success({}, 'Token revoked successfully'));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }
}
