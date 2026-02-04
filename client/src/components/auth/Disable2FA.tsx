import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldOff, AlertTriangle, Lock } from 'lucide-react';
import { authService } from '../../services/auth.service';
import Button from '../ui/Button';
import Input from '../ui/Input';

const disableSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});

type DisableFormData = z.infer<typeof disableSchema>;

interface Disable2FAProps {
    onComplete?: () => void;
    onCancel?: () => void;
}

export default function Disable2FA({ onComplete, onCancel }: Disable2FAProps) {
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<DisableFormData>({
        resolver: zodResolver(disableSchema),
    });

    const onSubmit = async (data: DisableFormData) => {
        try {
            setError(null);
            await authService.disable2FA(data.password);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to disable 2FA');
        }
    };

    if (isSuccess) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                        <ShieldOff className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold">2FA Disabled</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Two-factor authentication has been disabled on your account.
                    </p>
                </div>

                <div className="p-3 text-sm text-orange-700 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/20 rounded-md flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Your account is now less secure. Consider re-enabling 2FA for better protection.</span>
                </div>

                <Button className="w-full" onClick={onComplete}>
                    Done
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <ShieldOff className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold">Disable Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    This will remove the extra security layer from your account.
                </p>
            </div>

            <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Warning: Disabling 2FA makes your account more vulnerable to unauthorized access.</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md animate-slide-in">
                        {error}
                    </div>
                )}

                <div className="relative">
                    <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10 h-11"
                        error={errors.password?.message}
                        {...register('password')}
                    />
                </div>

                <div className="flex gap-3">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="destructive"
                        className="flex-1"
                        isLoading={isSubmitting}
                    >
                        {isSubmitting ? 'Disabling...' : 'Disable 2FA'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
