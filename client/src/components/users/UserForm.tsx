import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, RegisterData, Tenant } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { tenantService } from '../../services/tenant.service';

// Schema for user form - password is optional for edit mode
const userFormSchema = z.object({
    tenantId: z.string().min(1, 'Tenant is required'),
    loginId: z.string().min(3, 'Login ID must be at least 3 characters'),
    userName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().optional(),
    companyName: z.string().optional(),
    designation: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
    user?: User;
    onSubmit: (data: RegisterData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError,
        watch,
    } = useForm<UserFormData>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            tenantId: '',
            loginId: '',
            userName: '',
            email: '',
            password: '',
            companyName: '',
            designation: '',
        },
    });

    useEffect(() => {
        const loadTenants = async () => {
            try {
                const data = await tenantService.getAll();
                setTenants(data);
            } catch (err) {
                console.error('Failed to load tenants', err);
            } finally {
                setLoadingConfig(false);
            }
        };
        loadTenants();
    }, []);

    useEffect(() => {
        if (user && !loadingConfig) {
            // Reset form with user data after tenants are loaded
            console.log('Resetting form with user data:', {
                tenantId: user.tenantId,
                loginId: user.loginId,
                userName: user.userName,
                email: user.email,
                companyName: user.companyName,
                designation: user.designation,
            });

            reset({
                tenantId: user.tenantId || '',
                loginId: user.loginId || '',
                userName: user.userName || '',
                email: user.email || '',
                password: '',
                companyName: user.companyName || '',
                designation: user.designation || '',
            });
        }
    }, [user, reset, loadingConfig]);

    // Debug: Watch form values
    const formValues = watch();
    useEffect(() => {
        if (user) {
            console.log('Current form values:', formValues);
        }
    }, [formValues, user]);

    const handleFormSubmit = (data: UserFormData) => {
        // Validate password for new users
        if (!user && (!data.password || data.password.length < 6)) {
            setError('password', {
                type: 'manual',
                message: 'Password must be at least 6 characters'
            });
            return;
        }

        // When editing, don't include password if it's empty
        if (user && !data.password) {
            const { password, ...dataWithoutPassword } = data;
            onSubmit(dataWithoutPassword as RegisterData);
        } else {
            onSubmit(data as RegisterData);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tenant</label>
                <select
                    {...register('tenantId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                    disabled={!!user || loadingConfig}
                >
                    <option value="">{loadingConfig ? 'Loading...' : 'Select Tenant'}</option>
                    {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                {errors.tenantId && <p className="mt-1 text-sm text-red-500">{errors.tenantId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Login ID"
                    placeholder="jdoe"
                    {...register('loginId')}
                    error={errors.loginId?.message}
                    disabled={!!user} // Cannot change login ID usually
                />
                <Input
                    label="Full Name"
                    placeholder="John Doe"
                    {...register('userName')}
                    error={errors.userName?.message}
                />
            </div>

            <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                error={errors.email?.message}
            />

            {!user && (
                <Input
                    label="Password"
                    type="password"
                    placeholder="******"
                    {...register('password')}
                    error={errors.password?.message}
                    required
                />
            )}

            {user && (
                <p className="text-xs text-muted-foreground italic">
                    Password cannot be changed from this form. Use the user details modal to change password.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Company"
                    placeholder="Acme Inc"
                    {...register('companyName')}
                />
                <Input
                    label="Designation"
                    placeholder="Manager"
                    {...register('designation')}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {user ? 'Update User' : 'Create User'}
                </Button>
            </div>
        </form>
    );
}
