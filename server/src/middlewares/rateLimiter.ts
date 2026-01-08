import rateLimit from 'express-rate-limit';
import { Logger } from '../utils/Logger';

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count all requests
    handler: (req, res) => {
        Logger.warn('Rate limit exceeded for authentication', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
            retryAfter: 15 * 60, // seconds
        });
    },
});

/**
 * Moderate rate limiter for password reset
 * Prevents abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour per IP
    message: 'Too many password reset requests from this IP, please try again after 1 hour',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.warn('Rate limit exceeded for password reset', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many password reset requests from this IP, please try again after 1 hour',
            retryAfter: 60 * 60, // seconds
        });
    },
});

/**
 * Strict limiter for registration
 * Prevents mass account creation
 */
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: 'Too many accounts created from this IP, please try again after 1 hour',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.warn('Rate limit exceeded for registration', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many accounts created from this IP, please try again after 1 hour',
            retryAfter: 60 * 60, // seconds
        });
    },
});

/**
 * General API rate limiter
 * Prevents API abuse and DDoS
 */
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: 'Too many requests from this IP, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        Logger.warn('Rate limit exceeded for API', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please slow down',
            retryAfter: 60, // seconds
        });
    },
});

/**
 * Strict limiter for 2FA verification
 * Prevents brute force attacks on 2FA codes
 */
export const twoFactorLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: 'Too many 2FA verification attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.warn('Rate limit exceeded for 2FA', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many 2FA verification attempts, please try again after 15 minutes',
            retryAfter: 15 * 60, // seconds
        });
    },
});

/**
 * Moderate limiter for OAuth endpoints
 * Prevents abuse of OAuth flows
 */
export const oauthLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests per 5 minutes
    message: 'Too many OAuth requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.warn('Rate limit exceeded for OAuth', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many OAuth requests, please try again later',
            retryAfter: 5 * 60, // seconds
        });
    },
});
