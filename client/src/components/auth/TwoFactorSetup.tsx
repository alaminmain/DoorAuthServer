import { useState, useCallback } from 'react';
import { Shield, Copy, CheckCircle, AlertCircle, Smartphone, Key } from 'lucide-react';
import { authService } from '../../services/auth.service';
import Button from '../ui/Button';
import TOTPInput from './TOTPInput';
import { cn } from '../../utils/helpers';

type SetupStep = 'init' | 'scan' | 'verify' | 'backup' | 'complete';

interface TwoFactorSetupProps {
    onComplete?: () => void;
    onCancel?: () => void;
}

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
    const [step, setStep] = useState<SetupStep>('init');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedBackup, setCopiedBackup] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const startSetup = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await authService.generate2FA();
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setStep('scan');
        } catch (err: any) {
            setError(err.message || 'Failed to initialize 2FA setup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = useCallback(async (code: string) => {
        try {
            setIsLoading(true);
            setVerifyError(null);
            const result = await authService.verify2FA(code);

            if (result.backupCodes && result.backupCodes.length > 0) {
                setBackupCodes(result.backupCodes);
                setStep('backup');
            } else {
                setStep('complete');
            }
        } catch (err: any) {
            setVerifyError(err.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const copySecret = async () => {
        try {
            await navigator.clipboard.writeText(secret);
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        } catch (err) {
            console.error('Failed to copy secret:', err);
        }
    };

    const copyBackupCodes = async () => {
        try {
            await navigator.clipboard.writeText(backupCodes.join('\n'));
            setCopiedBackup(true);
            setTimeout(() => setCopiedBackup(false), 2000);
        } catch (err) {
            console.error('Failed to copy backup codes:', err);
        }
    };

    const handleComplete = () => {
        onComplete?.();
    };

    // Step: Initialize
    if (step === 'init') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Enable Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Add an extra layer of security to your account using a time-based one-time password (TOTP).
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md">
                        {error}
                    </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">You'll need:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            An authenticator app (Google Authenticator, Authy, etc.)
                        </li>
                        <li className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Access to your phone for scanning QR code
                        </li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    {onCancel && (
                        <Button variant="outline" className="flex-1" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        className="flex-1"
                        onClick={startSetup}
                        isLoading={isLoading}
                    >
                        {isLoading ? 'Setting up...' : 'Get Started'}
                    </Button>
                </div>
            </div>
        );
    }

    // Step: Scan QR Code
    if (step === 'scan') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Scan this QR code with your authenticator app
                    </p>
                </div>

                {/* QR Code Display */}
                <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-xl shadow-lg">
                        <img
                            src={qrCode}
                            alt="2FA QR Code"
                            className="w-48 h-48"
                        />
                    </div>
                </div>

                {/* Manual Entry Option */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                        Can't scan? Enter this code manually:
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-sm font-mono break-all select-all">
                            {secret}
                        </code>
                        <button
                            onClick={copySecret}
                            className="p-2 hover:bg-background rounded-md transition-colors"
                            title="Copy secret"
                        >
                            {copiedSecret ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>
                    </div>
                </div>

                <Button className="w-full" onClick={() => setStep('verify')}>
                    I've Added the Account
                </Button>
            </div>
        );
    }

    // Step: Verify Code
    if (step === 'verify') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Verify Setup</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter the 6-digit code from your authenticator app
                    </p>
                </div>

                <TOTPInput
                    onComplete={handleVerify}
                    disabled={isLoading}
                    error={verifyError || undefined}
                />

                {isLoading && (
                    <div className="text-center text-sm text-muted-foreground">
                        Verifying...
                    </div>
                )}

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep('scan')}
                    disabled={isLoading}
                >
                    Back to QR Code
                </Button>
            </div>
        );
    }

    // Step: Backup Codes
    if (step === 'backup') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Save Your Backup Codes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Store these codes somewhere safe. You can use them if you lose access to your authenticator.
                    </p>
                </div>

                <div className="p-3 text-sm text-orange-700 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Each code can only be used once. Save them securely!</span>
                </div>

                <div className="bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">Backup Codes</span>
                        <button
                            onClick={copyBackupCodes}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                            {copiedBackup ? (
                                <>
                                    <CheckCircle className="h-3 w-3" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3 w-3" />
                                    Copy All
                                </>
                            )}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                            <code
                                key={index}
                                className="text-sm font-mono p-2 bg-background rounded text-center select-all"
                            >
                                {code}
                            </code>
                        ))}
                    </div>
                </div>

                <Button className="w-full" onClick={() => setStep('complete')}>
                    I've Saved My Backup Codes
                </Button>
            </div>
        );
    }

    // Step: Complete
    if (step === 'complete') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <Shield className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold">2FA Enabled!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your account is now protected with two-factor authentication.
                    </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-md">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-700 dark:text-green-300">
                            <p className="font-medium mb-1">What happens next?</p>
                            <p>Each time you sign in, you'll need to enter a code from your authenticator app after your password.</p>
                        </div>
                    </div>
                </div>

                <Button className="w-full" onClick={handleComplete}>
                    Done
                </Button>
            </div>
        );
    }

    return null;
}
