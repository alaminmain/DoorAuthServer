import { Shield, ShieldOff } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface TwoFactorStatusProps {
    enabled: boolean;
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function TwoFactorStatus({
    enabled,
    className,
    showLabel = true,
    size = 'sm',
}: TwoFactorStatusProps) {
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

    if (enabled) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full font-medium',
                    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                    sizeClasses[size],
                    className
                )}
            >
                <Shield className={iconSizes[size]} />
                {showLabel && '2FA Enabled'}
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium',
                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                sizeClasses[size],
                className
            )}
        >
            <ShieldOff className={iconSizes[size]} />
            {showLabel && '2FA Disabled'}
        </span>
    );
}
