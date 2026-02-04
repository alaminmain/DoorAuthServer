import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface VerificationStatusProps {
    verified: boolean;
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function VerificationStatus({
    verified,
    className,
    showLabel = true,
    size = 'sm',
}: VerificationStatusProps) {
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    if (verified) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full font-medium',
                    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                    sizeClasses[size],
                    className
                )}
            >
                <CheckCircle className={iconSizes[size]} />
                {showLabel && 'Verified'}
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium',
                'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
                sizeClasses[size],
                className
            )}
        >
            <AlertCircle className={iconSizes[size]} />
            {showLabel && 'Unverified'}
        </span>
    );
}
