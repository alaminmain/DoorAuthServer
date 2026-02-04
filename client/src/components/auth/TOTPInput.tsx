import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '../../utils/helpers';

interface TOTPInputProps {
    length?: number;
    onComplete: (code: string) => void;
    disabled?: boolean;
    error?: string;
    autoFocus?: boolean;
    className?: string;
}

export default function TOTPInput({
    length = 6,
    onComplete,
    disabled = false,
    error,
    autoFocus = true,
    className,
}: TOTPInputProps) {
    const [values, setValues] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    // Check if all digits are filled and trigger onComplete
    useEffect(() => {
        const code = values.join('');
        if (code.length === length && !values.includes('')) {
            onComplete(code);
        }
    }, [values, length, onComplete]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1);

        const newValues = [...values];
        newValues[index] = digit;
        setValues(newValues);

        // Move to next input if digit entered
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!values[index] && index > 0) {
                // Move to previous input on backspace if current is empty
                inputRefs.current[index - 1]?.focus();
            }
            const newValues = [...values];
            newValues[index] = '';
            setValues(newValues);
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

        if (pastedData) {
            const newValues = [...values];
            for (let i = 0; i < pastedData.length; i++) {
                newValues[i] = pastedData[i];
            }
            setValues(newValues);

            // Focus the next empty input or the last one
            const nextEmptyIndex = newValues.findIndex((v) => !v);
            if (nextEmptyIndex !== -1) {
                inputRefs.current[nextEmptyIndex]?.focus();
            } else {
                inputRefs.current[length - 1]?.focus();
            }
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const reset = () => {
        setValues(Array(length).fill(''));
        inputRefs.current[0]?.focus();
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex justify-center gap-2 sm:gap-3">
                {values.map((value, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        onFocus={handleFocus}
                        disabled={disabled}
                        className={cn(
                            'w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold',
                            'rounded-lg border-2 bg-background',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                            'transition-all duration-200',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            error
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-muted hover:border-muted-foreground/50'
                        )}
                        aria-label={`Digit ${index + 1}`}
                    />
                ))}
            </div>

            {error && (
                <p className="text-sm text-red-500 text-center animate-slide-in">
                    {error}
                </p>
            )}

            <button
                type="button"
                onClick={reset}
                className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                Clear
            </button>
        </div>
    );
}
