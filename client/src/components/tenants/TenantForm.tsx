import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Tenant, CreateTenantDto } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const tenantSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    domain: z.string().min(3, 'Domain must be at least 3 characters').regex(/^[a-zA-Z0-9-.]+$/, 'Domain can only contain letters, numbers, dashes, and dots'),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantFormProps {
    tenant?: Tenant;
    onSubmit: (data: CreateTenantDto) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function TenantForm({ tenant, onSubmit, onCancel, isLoading }: TenantFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema),
        defaultValues: {
            name: '',
            domain: '',
        },
    });

    useEffect(() => {
        if (tenant) {
            reset({
                name: tenant.name,
                domain: tenant.domain,
            });
        } else {
            reset({
                name: '',
                domain: '',
            });
        }
    }, [tenant, reset]);

    const handleFormSubmit = (data: TenantFormData) => {
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <Input
                label="Tenant Name"
                placeholder="e.g. Acme Corp"
                {...register('name')}
                error={errors.name?.message}
            />

            <Input
                label="Domain"
                placeholder="e.g. acme.com"
                {...register('domain')}
                error={errors.domain?.message}
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {tenant ? 'Update Tenant' : 'Create Tenant'}
                </Button>
            </div>
        </form>
    );
}
