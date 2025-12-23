import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import type { Application, CreateApplicationDto, Tenant } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { tenantService } from '../../services/tenant.service';

const appSchema = z.object({
    tenantId: z.string().min(1, 'Tenant is required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    appUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    redirectUris: z.array(z.string().url('Must be a valid URL')).min(1, 'At least one redirect URI is required'),
});

type AppFormData = z.infer<typeof appSchema>;

interface ApplicationFormProps {
    application?: Application;
    onSubmit: (data: CreateApplicationDto) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ApplicationForm({ application, onSubmit, onCancel, isLoading }: ApplicationFormProps) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [redirectUris, setRedirectUris] = useState<string[]>(['']);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<AppFormData>({
        resolver: zodResolver(appSchema),
        defaultValues: {
            tenantId: '',
            name: '',
            description: '',
            appUrl: '',
            redirectUris: [''],
        },
    });

    useEffect(() => {
        // Load tenants for dropdown
        const loadTenants = async () => {
            try {
                const data = await tenantService.getAll();
                setTenants(data);
            } catch (err) {
                console.error('Failed to load tenants', err);
            }
        };
        loadTenants();
    }, []);

    useEffect(() => {
        if (application) {
            reset({
                tenantId: application.tenantId,
                name: application.name,
                description: application.description || '',
                appUrl: application.appUrl || '',
                redirectUris: application.redirectUris,
            });
            setRedirectUris(application.redirectUris);
        }
    }, [application, reset]);

    const addUri = () => setRedirectUris([...redirectUris, '']);
    const removeUri = (index: number) => {
        const newUris = redirectUris.filter((_, i) => i !== index);
        setRedirectUris(newUris);
        setValue('redirectUris', newUris);
    };

    const handleUriChange = (index: number, value: string) => {
        const newUris = [...redirectUris];
        newUris[index] = value;
        setRedirectUris(newUris);
        setValue('redirectUris', newUris);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tenant</label>
                <select
                    {...register('tenantId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                    disabled={!!application} // Cannot change tenant after creation usually
                >
                    <option value="">Select a Tenant</option>
                    {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                {errors.tenantId && <p className="mt-1 text-sm text-red-500">{errors.tenantId.message}</p>}
            </div>

            <Input
                label="Application Name"
                placeholder="e.g. Employee Portal"
                {...register('name')}
                error={errors.name?.message}
            />

            <Input
                label="Description (Optional)"
                placeholder="Brief description of the application"
                {...register('description')}
            />

            <Input
                label="Application URL (Optional)"
                placeholder="https://app.example.com"
                {...register('appUrl')}
                error={errors.appUrl?.message}
            />

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Redirect URIs</label>
                {redirectUris.map((uri, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <Input
                            value={uri}
                            onChange={(e) => handleUriChange(index, e.target.value)}
                            placeholder="https://app.example.com/callback"
                        />
                        {redirectUris.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeUri(index)}>
                                <X size={16} />
                            </Button>
                        )}
                    </div>
                ))}
                {errors.redirectUris && <p className="mt-1 text-sm text-red-500">{errors.redirectUris.message}</p>}
                <Button type="button" variant="outline" size="sm" onClick={addUri} className="mt-2">
                    <Plus size={16} className="mr-2" /> Add URI
                </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {application ? 'Update Application' : 'Create Application'}
                </Button>
            </div>
        </form>
    );
}
