import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../services/auth.service';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setError(null);
            await authService.forgotPassword(data.email);
            setSubmittedEmail(data.email);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            <Card className="w-full max-w-md border-opacity-20 glass shadow-2xl animate-scale-in">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="flex justify-center mb-2">
                        <div className={`p-3 rounded-2xl ring-1 ${isSuccess ? 'bg-green-500/10 text-green-600 ring-green-500/20' : 'bg-primary/10 text-primary ring-primary/20'}`}>
                            {isSuccess ? <CheckCircle className="h-10 w-10" /> : <Mail className="h-10 w-10" />}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                        {isSuccess ? 'Check Your Email' : 'Forgot Password'}
                    </CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? `We've sent a password reset link to ${submittedEmail}`
                            : 'Enter your email address and we\'ll send you a link to reset your password'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="space-y-6">
                            <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-md">
                                <p className="font-medium mb-1">Reset link sent!</p>
                                <p className="text-green-600 dark:text-green-400">
                                    If an account exists with this email, you'll receive instructions to reset your password within a few minutes.
                                </p>
                            </div>

                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive the email? Check your spam folder or
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setSubmittedEmail('');
                                    }}
                                >
                                    Try another email
                                </Button>
                            </div>

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
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md animate-slide-in">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="pl-10 h-11"
                                        error={errors.email?.message}
                                        {...register('email')}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base shadow-primary/25 mt-6"
                                isLoading={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
                    )}
                </CardContent>
            </Card>

            {/* Footer info */}
            <div className="absolute bottom-4 text-center w-full text-xs text-muted-foreground/60">
                &copy; {new Date().getFullYear()} DoorAuth Server. All rights reserved.
            </div>
        </div>
    );
}
