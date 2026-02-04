import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth.service';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type TokenStatus = 'validating' | 'valid' | 'invalid' | 'expired';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [error, setError] = useState<string | null>(null);
    const [tokenStatus, setTokenStatus] = useState<TokenStatus>('validating');
    const [tokenEmail, setTokenEmail] = useState<string>('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        mode: 'onChange',
    });

    const password = watch('password', '');

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenStatus('invalid');
                return;
            }

            try {
                const result = await authService.validateResetToken(token);
                if (result.valid) {
                    setTokenStatus('valid');
                    if (result.email) {
                        setTokenEmail(result.email);
                    }
                } else {
                    setTokenStatus('expired');
                }
            } catch (err: any) {
                if (err.message?.toLowerCase().includes('expired')) {
                    setTokenStatus('expired');
                } else {
                    setTokenStatus('invalid');
                }
            }
        };

        validateToken();
    }, [token]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) return;

        try {
            setError(null);
            await authService.resetPassword(token, data.password);
            setIsSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login?resetSuccess=true');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
        }
    };

    // Password strength indicator
    const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength++;

        if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
        if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
        return { strength, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password);

    const renderContent = () => {
        // Token validation loading
        if (tokenStatus === 'validating') {
            return (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Validating reset link...</p>
                </div>
            );
        }

        // Invalid or expired token
        if (tokenStatus === 'invalid' || tokenStatus === 'expired') {
            return (
                <div className="space-y-6">
                    <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium mb-1">
                                    {tokenStatus === 'expired' ? 'Reset Link Expired' : 'Invalid Reset Link'}
                                </p>
                                <p className="text-red-600 dark:text-red-400">
                                    {tokenStatus === 'expired'
                                        ? 'This password reset link has expired. Please request a new one.'
                                        : 'This password reset link is invalid or has already been used.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link to="/forgot-password">
                        <Button variant="outline" className="w-full">
                            Request New Reset Link
                        </Button>
                    </Link>

                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign In
                    </Link>
                </div>
            );
        }

        // Success state
        if (isSuccess) {
            return (
                <div className="space-y-6">
                    <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-md">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium mb-1">Password Reset Successful!</p>
                                <p className="text-green-600 dark:text-green-400">
                                    Your password has been changed. Redirecting to login...
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link to="/login">
                        <Button className="w-full">
                            Sign In Now
                        </Button>
                    </Link>
                </div>
            );
        }

        // Reset form
        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md animate-slide-in">
                        {error}
                    </div>
                )}

                {tokenEmail && (
                    <div className="p-3 text-sm text-muted-foreground bg-muted/50 rounded-md">
                        Resetting password for: <span className="font-medium text-foreground">{tokenEmail}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                        <Input
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            className="pl-10 pr-10 h-11"
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Password strength indicator */}
                    {password && (
                        <div className="space-y-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-1 flex-1 rounded-full transition-colors ${
                                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                Password strength: {passwordStrength.label}
                            </p>
                        </div>
                    )}

                    <div className="relative">
                        <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                        <Input
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            className="pl-10 pr-10 h-11"
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-9 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                        <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>One uppercase letter</li>
                        <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>One lowercase letter</li>
                        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>One number</li>
                        <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : ''}>One special character</li>
                    </ul>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 text-base shadow-primary/25 mt-6"
                    isLoading={isSubmitting}
                >
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted"></div>
                    </div>
                </div>

                <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                </Link>
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
                            isSuccess
                                ? 'bg-green-500/10 text-green-600 ring-green-500/20'
                                : tokenStatus === 'invalid' || tokenStatus === 'expired'
                                    ? 'bg-red-500/10 text-red-600 ring-red-500/20'
                                    : 'bg-primary/10 text-primary ring-primary/20'
                        }`}>
                            {isSuccess ? (
                                <CheckCircle className="h-10 w-10" />
                            ) : tokenStatus === 'invalid' || tokenStatus === 'expired' ? (
                                <AlertCircle className="h-10 w-10" />
                            ) : (
                                <Lock className="h-10 w-10" />
                            )}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                        {isSuccess ? 'Password Changed' : tokenStatus === 'invalid' || tokenStatus === 'expired' ? 'Link Invalid' : 'Reset Password'}
                    </CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? 'Your password has been successfully reset'
                            : tokenStatus === 'invalid' || tokenStatus === 'expired'
                                ? 'This reset link cannot be used'
                                : 'Create a new secure password for your account'}
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
