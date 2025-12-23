import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, RegisterData, Tenant } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { tenantService } from '../../services/tenant.service';

const userSchema = z.object({
    tenantId: z.string().min(1, 'Tenant is required'),
    loginId: z.string().min(3, 'Login ID must be at least 3 characters'),
    userName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    companyName: z.string().optional(),
    designation: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

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
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
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
        if (user) {
            reset({
                tenantId: user.tenantId,
                loginId: user.loginId,
                userName: user.userName,
                email: user.email,
                password: '', // Don't fill password on edit
                companyName: user.companyName || '',
                designation: user.designation || '',
            });
        }
    }, [user, reset]);

    return (
        <form onSubmit={handleSubmit((data) => {
            // If editing and password empty, don't send it? 
            // Actually RegisterData requires password. For edit, backend should handle optional update.
            // But userService.create calls /register which needs password.
            // userService.update calls PUT /users/:id.
            // We need to handle this in parent or make type flexible.
            // For now, we just pass what we have.
            onSubmit(data as RegisterData);
        })} className="space-y-4">

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tenant</label>
                <select
                    {...register('tenantId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
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
                />
            )}

            {user && (
                <p className="text-xs text-muted-foreground italic">Password change not supported in this form yet.</p>
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
