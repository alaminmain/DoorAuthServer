import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/Logger';

const KEYS_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

export class JWKSService {
    private static instance: JWKSService;
    private privateKey: string = '';
    private publicKey: string = '';
    private kid: string = ''; // Key ID

    private constructor() {
        this.initializeKeys();
    }

    public static getInstance(): JWKSService {
        if (!JWKSService.instance) {
            JWKSService.instance = new JWKSService();
        }
        return JWKSService.instance;
    }

    private initializeKeys() {
        try {
            // Create keys directory if it doesn't exist
            if (!fs.existsSync(KEYS_DIR)) {
                fs.mkdirSync(KEYS_DIR, { recursive: true });
                Logger.info('[JWKS] Created keys directory');
            }

            // Check if keys exist
            if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
                // Load existing keys
                this.privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
                this.publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
                this.kid = this.generateKeyId(this.publicKey);
                Logger.info('[JWKS] Loaded existing RSA keys', { kid: this.kid });
            } else {
                // Generate new keys
                this.generateKeys();
            }
        } catch (error: any) {
            Logger.error('[JWKS] Failed to initialize keys', { error: error.message });
            throw error;
        }
    }

    private generateKeys() {
        Logger.info('[JWKS] Generating new RSA key pair...');

        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.kid = this.generateKeyId(publicKey);

        // Save keys to disk
        fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
        fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);

        Logger.info('[JWKS] Generated and saved new RSA keys', { kid: this.kid });
    }

    private generateKeyId(publicKey: string): string {
        // Generate a unique key ID based on the public key hash
        const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
        return hash.substring(0, 16);
    }

    public getPrivateKey(): string {
        return this.privateKey;
    }

    public getPublicKey(): string {
        return this.publicKey;
    }

    public getKeyId(): string {
        return this.kid;
    }

    /**
     * Get JWKS (JSON Web Key Set) for the /.well-known/jwks.json endpoint
     */
    public getJWKS(): any {
        try {
            // Convert PEM public key to JWK format
            const publicKeyObject = crypto.createPublicKey(this.publicKey);
            const jwk = publicKeyObject.export({ format: 'jwk' });

            return {
                keys: [
                    {
                        ...jwk,
                        kid: this.kid,
                        alg: 'RS256',
                        use: 'sig',
                        kty: 'RSA'
                    }
                ]
            };
        } catch (error: any) {
            Logger.error('[JWKS] Failed to generate JWKS', { error: error.message });
            return { keys: [] };
        }
    }

    /**
     * Rotate keys (for production key rotation)
     */
    public rotateKeys() {
        Logger.warn('[JWKS] Rotating RSA keys...');

        // Backup old keys
        if (fs.existsSync(PRIVATE_KEY_PATH)) {
            const timestamp = Date.now();
            fs.renameSync(PRIVATE_KEY_PATH, `${PRIVATE_KEY_PATH}.${timestamp}.bak`);
            fs.renameSync(PUBLIC_KEY_PATH, `${PUBLIC_KEY_PATH}.${timestamp}.bak`);
        }

        // Generate new keys
        this.generateKeys();

        Logger.info('[JWKS] Key rotation completed', { new_kid: this.kid });
    }
}

export const jwksService = JWKSService.getInstance();
