import { Router, Request, Response } from 'express';
import { Logger } from '../utils/Logger';
import { jwksService } from '../services/jwks.service';

const router = Router();

/**
 * OpenID Connect Discovery Endpoint
 * Returns metadata about the OAuth/OIDC provider
 */
router.get('/openid-configuration', (req: Request, res: Response) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const clientIp = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    Logger.info('[OIDC] Discovery endpoint accessed', {
        baseUrl,
        clientIp,
        userAgent: userAgent?.substring(0, 100) // Truncate long user agents
    });

    const config = {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
        token_endpoint: `${baseUrl}/api/oauth/token`,
        userinfo_endpoint: `${baseUrl}/api/oauth/userinfo`,
        revocation_endpoint: `${baseUrl}/api/oauth/revoke`,
        jwks_uri: `${baseUrl}/.well-known/jwks.json`,
        response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token', 'token id_token', 'code token id_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256', 'HS256'],
        scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
        claims_supported: [
            'sub',
            'iss',
            'aud',
            'exp',
            'iat',
            'email',
            'email_verified',
            'name',
            'preferred_username'
        ],
        code_challenge_methods_supported: ['S256', 'plain'],
        grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials']
    };

    res.json(config);
});

/**
 * JWKS (JSON Web Key Set) Endpoint
 * Returns public keys for token verification
 */
router.get('/jwks.json', (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress;

    Logger.info('[OIDC] JWKS endpoint accessed', { clientIp });

    try {
        const jwks = jwksService.getJWKS();
        Logger.info('[OIDC] Returning JWKS', {
            key_count: jwks.keys.length,
            kid: jwks.keys[0]?.kid
        });
        res.json(jwks);
    } catch (error: any) {
        Logger.error('[OIDC] Failed to generate JWKS', { error: error.message });
        res.status(500).json({
            error: 'server_error',
            error_description: 'Failed to generate JWKS'
        });
    }
});

export default router;
