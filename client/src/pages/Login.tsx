import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError(null);
            await login(data);

            // Cookie is managed by the server (HttpOnly)

            const returnUrl = searchParams.get('returnUrl');
            if (returnUrl) {
                window.location.href = returnUrl;
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials.');
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
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                        DoorAuth Admin
                    </CardTitle>
                    <CardDescription>
                        Enter your credentials to access the secure portal
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                    placeholder="admin@example.com"
                                    className="pl-10 h-11"
                                    error={errors.email?.message}
                                    {...register('email')}
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11"
                                    error={errors.password?.message}
                                    {...register('password')}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base shadow-primary/25 mt-6"
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-muted"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Secure System</span>
                            </div>
                        </div>

                        <div className="text-center text-xs text-muted-foreground">
                            <p>Protected by DoorAuth Identity Server</p>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Footer info */}
            <div className="absolute bottom-4 text-center w-full text-xs text-muted-foreground/60">
                &copy; {new Date().getFullYear()} DoorAuth Server. All rights reserved.
            </div>
        </div>
    );
}
