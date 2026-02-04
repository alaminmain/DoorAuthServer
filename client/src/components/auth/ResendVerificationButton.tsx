import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';
import Button from '../ui/Button';
import { cn } from '../../utils/helpers';

interface ResendVerificationButtonProps {
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'link';
    size?: 'sm' | 'default' | 'lg';
    showIcon?: boolean;
}

export default function ResendVerificationButton({
    className,
    variant = 'outline',
    size = 'sm',
    showIcon = true,
}: ResendVerificationButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    const handleResend = async () => {
        try {
            setIsLoading(true);
            setStatus('idle');
            setMessage('');

            await authService.resendVerificationEmail();

            setStatus('success');
            setMessage('Verification email sent!');

            // Reset after 5 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to send email');

            // Reset after 5 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className={cn('flex items-center gap-2 text-sm text-green-600 dark:text-green-400', className)}>
                <CheckCircle className="h-4 w-4" />
                <span>{message}</span>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col gap-2">
                <div className={cn('flex items-center gap-2 text-sm text-red-600 dark:text-red-400', className)}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{message}</span>
                </div>
                <Button
                    variant={variant}
                    size={size}
                    onClick={handleResend}
                    className={className}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleResend}
            isLoading={isLoading}
            className={className}
        >
            {showIcon && !isLoading && <Mail className="mr-2 h-4 w-4" />}
            {isLoading ? 'Sending...' : 'Resend Verification Email'}
        </Button>
    );
}
