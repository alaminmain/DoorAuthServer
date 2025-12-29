import { Request, Response } from 'express';
import { OAuthService } from '../services/oauth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';
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

            const clientIp = req.ip || req.socket.remoteAddress;

            Logger.info('[OIDC] Authorization request received', {
                client_id,
                redirect_uri,
                response_type,
                scope,
                has_pkce: !!code_challenge,
                code_challenge_method,
                clientIp
            });

            // Validate required parameters
            if (!response_type || !client_id || !redirect_uri) {
                Logger.warn('[OIDC] Authorization failed - missing parameters', {
                    client_id,
                    has_response_type: !!response_type,
                    has_redirect_uri: !!redirect_uri
                });
                res.status(400).json(ApiResponse.error('Missing required parameters: response_type, client_id, redirect_uri'));
                return;
            }

            // Only support authorization code flow
            if (response_type !== 'code') {
                Logger.warn('[OIDC] Authorization failed - unsupported response_type', {
                    client_id,
                    response_type
                });
                res.status(400).json(ApiResponse.error('Unsupported response_type. Only "code" is supported.'));
                return;
            }

            // Check if user is authenticated
            const user = (req as any).user;
            if (!user) {
                Logger.info('[OIDC] User not authenticated - redirecting to login', {
                    client_id,
                    redirect_uri
                });
                // Redirect to login page
                const loginUrl = new URL(process.env.LOGIN_URL || 'https://localhost:3000/login');
                const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
                loginUrl.searchParams.append('returnUrl', fullUrl);
                res.redirect(loginUrl.toString());
                return;
            }

            Logger.info('[OIDC] User authenticated - generating authorization code', {
                client_id,
                userId: user.userId,
                email: user.email
            });

            // Generate authorization code
            const result = await oauthService.generateAuthorizationCode({
                clientId: client_id as string,
                userId: user.userId,
                redirectUri: redirect_uri as string,
                scope: scope as string,
                codeChallenge: code_challenge as string,
                codeChallengeMethod: code_challenge_method as string || 'S256',
            });

            Logger.info('[OIDC] Authorization code generated successfully', {
                client_id,
                userId: user.userId,
                code_length: result.code.length,
                expires_in: result.expiresIn
            });

            // Perform actual redirect
            const redirectUrl = new URL(redirect_uri as string);
            redirectUrl.searchParams.append('code', result.code);
            if (state) {
                redirectUrl.searchParams.append('state', state as string);
            }

            Logger.info('[OIDC] Redirecting to client callback', {
                client_id,
                redirect_uri,
                has_state: !!state
            });

            res.redirect(redirectUrl.toString());
        } catch (error: any) {
            Logger.error('[OIDC] Authorization error', {
                error: error.message,
                stack: error.stack
            });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * OAuth Token Endpoint
     * POST /oauth/token
     */
    async token(req: Request, res: Response) {
        try {
            let client_id = req.body.client_id;
            let client_secret = req.body.client_secret;

            // Check if credentials are in Authorization header (Basic Auth)
            const authHeader = req.get('authorization');
            if (authHeader && authHeader.startsWith('Basic ')) {
                const base64Credentials = authHeader.substring(6);
                const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
                const [headerClientId, headerClientSecret] = credentials.split(':');

                // Use header credentials if body credentials are missing
                if (!client_id) client_id = headerClientId;
                if (!client_secret) client_secret = headerClientSecret;

                Logger.info('[OIDC] Client credentials extracted from Authorization header', {
                    client_id: headerClientId
                });
            }

            const {
                grant_type,
                code,
                redirect_uri,
                refresh_token,
                code_verifier,
            } = req.body;

            const clientIp = req.ip || req.socket.remoteAddress;
            const contentType = req.get('content-type');

            Logger.info('[OIDC] Token request received', {
                grant_type,
                client_id,
                redirect_uri,
                has_code: !!code,
                has_refresh_token: !!refresh_token,
                has_code_verifier: !!code_verifier,
                has_client_secret: !!client_secret,
                content_type: contentType,
                body_keys: Object.keys(req.body),
                has_auth_header: !!authHeader,
                clientIp
            });

            // Validate required parameters - return OAuth standard error format
            if (!grant_type || !client_id || !client_secret) {
                Logger.warn('[OIDC] Token request failed - missing credentials', {
                    client_id,
                    has_grant_type: !!grant_type,
                    has_client_secret: !!client_secret
                });
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'Missing required parameters: grant_type, client_id, client_secret'
                });
                return;
            }

            let tokenResponse;

            if (grant_type === 'authorization_code') {
                Logger.info('[OIDC] Processing authorization_code grant', {
                    client_id,
                    redirect_uri,
                    code_length: code?.length
                });

                // Exchange authorization code for tokens
                if (!code || !redirect_uri) {
                    Logger.warn('[OIDC] Token exchange failed - missing code or redirect_uri', {
                        client_id,
                        has_code: !!code,
                        has_redirect_uri: !!redirect_uri
                    });
                    res.status(400).json({
                        error: 'invalid_request',
                        error_description: 'Missing required parameters: code, redirect_uri'
                    });
                    return;
                }

                tokenResponse = await oauthService.exchangeCodeForToken({
                    code,
                    clientId: client_id,
                    clientSecret: client_secret,
                    redirectUri: redirect_uri,
                    codeVerifier: code_verifier,
                });

                Logger.info('[OIDC] Tokens generated successfully', {
                    client_id,
                    has_access_token: !!tokenResponse.access_token,
                    has_refresh_token: !!tokenResponse.refresh_token,
                    has_id_token: !!tokenResponse.id_token,
                    expires_in: tokenResponse.expires_in
                });

            } else if (grant_type === 'refresh_token') {
                Logger.info('[OIDC] Processing refresh_token grant', {
                    client_id
                });

                // Refresh access token
                if (!refresh_token) {
                    Logger.warn('[OIDC] Token refresh failed - missing refresh_token', {
                        client_id
                    });
                    res.status(400).json({
                        error: 'invalid_request',
                        error_description: 'Missing required parameter: refresh_token'
                    });
                    return;
                }

                tokenResponse = await oauthService.refreshAccessToken({
                    refreshToken: refresh_token,
                    clientId: client_id,
                    clientSecret: client_secret,
                });

                Logger.info('[OIDC] Token refreshed successfully', {
                    client_id,
                    has_access_token: !!tokenResponse.access_token
                });

            } else {
                Logger.warn('[OIDC] Token request failed - unsupported grant_type', {
                    client_id,
                    grant_type
                });
                res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: 'Supported grant types: authorization_code, refresh_token'
                });
                return;
            }

            // Return the token response directly (should already be in correct format)
            res.status(200).json(tokenResponse);
        } catch (error: any) {
            Logger.error('[OIDC] Token exchange error', {
                error: error.message,
                client_id: req.body.client_id,
                grant_type: req.body.grant_type,
                stack: error.stack
            });
            // Return OAuth standard error format
            res.status(400).json({
                error: 'invalid_grant',
                error_description: error.message || 'Token exchange failed'
            });
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
