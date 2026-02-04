import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, X, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import Button from '../ui/Button';

export default function EmailVerificationBanner() {
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    // Don't show if user is verified or banner is dismissed
    if (!user || user.emailVerified || dismissed) {
        return null;
    }

    const handleResend = async () => {
        try {
            setIsResending(true);
            await authService.resendVerificationEmail();
            setResendSuccess(true);
            setTimeout(() => setResendSuccess(false), 5000);
        } catch (error) {
            console.error('Failed to resend verification email:', error);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-900/30">
            <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            <span className="font-medium">Email not verified.</span>{' '}
                            <span className="hidden sm:inline">
                                Please verify your email address to access all features.
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {resendSuccess ? (
                            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                Email sent!
                            </span>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResend}
                                    isLoading={isResending}
                                    className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 dark:text-orange-300 dark:hover:text-orange-100 dark:hover:bg-orange-900/30"
                                >
                                    {!isResending && <Mail className="mr-1 h-4 w-4" />}
                                    {isResending ? 'Sending...' : 'Resend'}
                                </Button>

                                <Link to="/verify-email">
                                    <Button
                                        size="sm"
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        Verify Now
                                    </Button>
                                </Link>
                            </>
                        )}

                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 rounded-md text-orange-600 hover:text-orange-800 hover:bg-orange-100 dark:text-orange-400 dark:hover:text-orange-200 dark:hover:bg-orange-900/30 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
