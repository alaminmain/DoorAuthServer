import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const verifyTokenSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});

type VerifyTokenFormData = z.infer<typeof verifyTokenSchema>;

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const tokenFromUrl = searchParams.get('token');

    const [status, setStatus] = useState<VerificationStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<VerifyTokenFormData>({
        resolver: zodResolver(verifyTokenSchema),
    });

    // Auto-verify if token is in URL
    useEffect(() => {
        if (tokenFromUrl) {
            setValue('token', tokenFromUrl);
            verifyToken(tokenFromUrl);
        }
    }, [tokenFromUrl]);

    const verifyToken = async (token: string) => {
        try {
            setStatus('verifying');
            setError(null);

            // Try link verification first (GET), fall back to POST
            try {
                await authService.verifyEmailByLink(token);
            } catch {
                await authService.verifyEmail(token);
            }

            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'Verification failed. The token may be invalid or expired.');
        }
    };

    const onSubmit = async (data: VerifyTokenFormData) => {
        await verifyToken(data.token);
    };

    const handleResendVerification = async () => {
        try {
            setResendLoading(true);
            setResendSuccess(false);
            await authService.resendVerificationEmail();
            setResendSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification email');
        } finally {
            setResendLoading(false);
        }
    };

    const renderContent = () => {
        // Verifying state
        if (status === 'verifying') {
            return (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verifying your email...</p>
                </div>
            );
        }

        // Success state
        if (status === 'success') {
            return (
                <div className="space-y-6">
                    <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-md">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium mb-1">Email Verified!</p>
                                <p className="text-green-600 dark:text-green-400">
                                    Your email has been successfully verified. You now have full access to all features.
                                </p>
                            </div>
                        </div>
                    </div>

                    {user ? (
                        <Button
                            className="w-full"
                            onClick={() => navigate('/')}
                        >
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Link to="/login">
                            <Button className="w-full">
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            );
        }

        // Error state (but still show form)
        // Or idle state with form
        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md animate-slide-in">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {resendSuccess && (
                    <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-md animate-slide-in">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>Verification email sent! Check your inbox.</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                        <Input
                            label="Verification Token"
                            type="text"
                            placeholder="Enter your verification token"
                            className="pl-10 h-11"
                            error={errors.token?.message}
                            {...register('token')}
                        />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Enter the verification token from your email, or click the verification link in your email.
                </p>

                <Button
                    type="submit"
                    className="w-full h-11 text-base shadow-primary/25 mt-4"
                    isLoading={isSubmitting}
                >
                    {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </Button>

                {user && (
                    <>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-muted"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">or</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleResendVerification}
                            isLoading={resendLoading}
                        >
                            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                        </Button>
                    </>
                )}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted"></div>
                    </div>
                </div>

                {user ? (
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                ) : (
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign In
                    </Link>
                )}
            </form>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            <Card className="w-full max-w-md border-opacity-20 glass shadow-2xl animate-scale-in">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="flex justify-center mb-2">
                        <div className={`p-3 rounded-2xl ring-1 ${
                            status === 'success'
                                ? 'bg-green-500/10 text-green-600 ring-green-500/20'
                                : status === 'error'
                                    ? 'bg-orange-500/10 text-orange-600 ring-orange-500/20'
                                    : 'bg-primary/10 text-primary ring-primary/20'
                        }`}>
                            {status === 'success' ? (
                                <CheckCircle className="h-10 w-10" />
                            ) : status === 'error' ? (
                                <AlertCircle className="h-10 w-10" />
                            ) : (
                                <Mail className="h-10 w-10" />
                            )}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                        {status === 'success' ? 'Email Verified!' : status === 'error' ? 'Verification Failed' : 'Verify Your Email'}
                    </CardTitle>
                    <CardDescription>
                        {status === 'success'
                            ? 'Your email address has been confirmed'
                            : status === 'error'
                                ? 'Please try again or request a new verification email'
                                : 'Confirm your email address to unlock all features'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>

            {/* Footer info */}
            <div className="absolute bottom-4 text-center w-full text-xs text-muted-foreground/60">
                &copy; {new Date().getFullYear()} DoorAuth Server. All rights reserved.
            </div>
        </div>
    );
}
