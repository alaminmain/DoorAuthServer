import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Menu, CreateMenuDto, Application } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { applicationService } from '../../services/application.service';
import { menuService } from '../../services/menu.service';

const menuSchema = z.object({
    applicationId: z.string().min(1, 'Application is required'),
    label: z.string().min(1, 'Label is required'),
    path: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().optional().nullable(),
    order: z.coerce.number().int().min(0).default(0),
    requiredPermission: z.string().optional(),
});

type MenuFormData = z.infer<typeof menuSchema>;

interface MenuFormProps {
    menu?: Menu;
    onSubmit: (data: CreateMenuDto) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function MenuForm({ menu, onSubmit, onCancel, isLoading }: MenuFormProps) {
    const [applications, setApplications] = useState<Application[]>();
    const [possibleParents, setPossibleParents] = useState<Menu[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<MenuFormData>({
        resolver: zodResolver(menuSchema) as any,
        defaultValues: {
            applicationId: '',
            label: '',
            path: '',
            icon: '',
            parentId: '',
            order: 0,
            requiredPermission: '',
        },
    });

    const selectedAppId = watch('applicationId');

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const appsData = await applicationService.getAll();
                setApplications(appsData);
            } catch (err) {
                console.error('Failed to load config', err);
            } finally {
                setLoadingConfig(false);
            }
        };
        loadConfig();
    }, []);

    useEffect(() => {
        if (selectedAppId) {
            menuService.getAll(selectedAppId).then(data => {
                setPossibleParents(data.filter(m => m.id !== menu?.id));
            }).catch(console.error);
        } else {
            setPossibleParents([]);
        }
    }, [selectedAppId, menu?.id]);

    useEffect(() => {
        if (menu) {
            reset({
                applicationId: menu.applicationId,
                label: menu.label,
                path: menu.path || '',
                icon: menu.icon || '',
                parentId: menu.parentId || '',
                order: menu.order,
                requiredPermission: menu.requiredPermission || '',
            });
        }
    }, [menu, reset]);

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data as unknown as CreateMenuDto))} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Application</label>
                <select
                    {...register('applicationId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                    disabled={!!menu || loadingConfig}
                >
                    <option value="">{loadingConfig ? 'Loading...' : 'Select an Application'}</option>
                    {applications?.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                </select>
                {errors.applicationId && <p className="mt-1 text-sm text-red-500">{errors.applicationId.message}</p>}
            </div>

            <Input
                label="Menu Label"
                placeholder="e.g. Dashboard"
                {...register('label')}
                error={errors.label?.message}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Path"
                    placeholder="/dashboard"
                    {...register('path')}
                />
                <Input
                    label="Icon (Lucide name)"
                    placeholder="LayoutDashboard"
                    {...register('icon')}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Parent Menu</label>
                    <select
                        {...register('parentId')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                    >
                        <option value="">None (Top Level)</option>
                        {possibleParents.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>
                <Input
                    type="number"
                    label="Order"
                    {...register('order')}
                    error={errors.order?.message}
                />
            </div>

            <Input
                label="Required Permission (Optional)"
                placeholder="e.g. dashboard.view"
                {...register('requiredPermission')}
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {menu ? 'Update Menu' : 'Create Menu'}
                </Button>
            </div>
        </form>
    );
}
