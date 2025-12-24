import axios from 'axios';
import { authConfig } from '../auth/authConfig';

const STORAGE_KEY_VERIFIER = 'pkce_verifier';
const STORAGE_KEY_TOKEN = 'access_token';

export const AuthService = {
    async generatePKCE() {
        const verifier = this.generateCodeVerifier();
        const challenge = await this.generateCodeChallenge(verifier);
        localStorage.setItem(STORAGE_KEY_VERIFIER, verifier);
        return { verifier, challenge };
    },

    generateCodeVerifier() {
        const array = new Uint32Array(56 / 2);
        window.crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    },

    async generateCodeChallenge(verifier: string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        return base64Digest;
    },

    async login() {
        const { challenge } = await this.generatePKCE();
        const params = new URLSearchParams({
            client_id: authConfig.clientId,
            redirect_uri: authConfig.redirectUri,
            response_type: authConfig.responseType,
            scope: authConfig.scope,
            code_challenge: challenge,
            code_challenge_method: 'S256'
        });
        window.location.href = `${authConfig.authority}/api/oauth/authorize?${params.toString()}`;
    },

    async handleCallback(code: string) {
        const verifier = localStorage.getItem(STORAGE_KEY_VERIFIER);
        if (!verifier) throw new Error('No PKCE verifier found');

        const response = await axios.post(`${authConfig.authority}/api/oauth/token`, {
            grant_type: 'authorization_code',
            client_id: authConfig.clientId,
            client_secret: 'todo-secret-key', // Secret required by current server implementation
            code,
            redirect_uri: authConfig.redirectUri,
            code_verifier: verifier
        });

        const token = response.data.access_token || (response.data.data && response.data.data.access_token);

        if (token) {
            localStorage.setItem(STORAGE_KEY_TOKEN, token);
            localStorage.removeItem(STORAGE_KEY_VERIFIER);
            return token;
        }
        throw new Error('No access token received');
    },

    getToken() {
        return localStorage.getItem(STORAGE_KEY_TOKEN);
    },

    logout() {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        window.location.href = '/login';
    }
};
