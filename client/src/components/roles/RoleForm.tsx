import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Role, CreateRoleDto, Tenant, Permission } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { tenantService } from '../../services/tenant.service';
import { roleService } from '../../services/role.service';

const roleSchema = z.object({
    tenantId: z.string().min(1, 'Tenant is required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
    role?: Role;
    onSubmit: (data: CreateRoleDto) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function RoleForm({ role, onSubmit, onCancel, isLoading }: RoleFormProps) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            tenantId: '',
            name: '',
            description: '',
            permissionIds: [],
        },
    });

    const selectedPermissionIds = watch('permissionIds') || [];

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const [tenantsData, permissionsData] = await Promise.all([
                    tenantService.getAll(),
                    roleService.getAllPermissions()
                ]);
                setTenants(tenantsData);
                setPermissions(permissionsData);
            } catch (err) {
                console.error('Failed to load config', err);
            } finally {
                setLoadingConfig(false);
            }
        };
        loadConfig();
    }, []);

    useEffect(() => {
        if (role) {
            reset({
                tenantId: role.tenantId,
                name: role.name,
                description: role.description || '',
                permissionIds: role.permissions?.map(p => p.id) || [],
            });
        }
    }, [role, reset]);

    const permissionsByResource = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        permissions.forEach(p => {
            if (!groups[p.resource]) groups[p.resource] = [];
            groups[p.resource].push(p);
        });
        return groups;
    }, [permissions]);

    const togglePermission = (id: string) => {
        const current = selectedPermissionIds;
        const isSelected = current.includes(id);
        if (isSelected) {
            setValue('permissionIds', current.filter(pid => pid !== id));
        } else {
            setValue('permissionIds', [...current, id]);
        }
    };

    const toggleResource = (resource: string) => {
        const group = permissionsByResource[resource];
        const groupIds = group.map(p => p.id);
        const allSelected = groupIds.every(id => selectedPermissionIds.includes(id));

        if (allSelected) {
            setValue('permissionIds', selectedPermissionIds.filter(id => !groupIds.includes(id)));
        } else {
            const newIds = Array.from(new Set([...selectedPermissionIds, ...groupIds]));
            setValue('permissionIds', newIds);
        }
    };

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data as CreateRoleDto))} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tenant</label>
                    <select
                        {...register('tenantId')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                        disabled={!!role}
                    >
                        <option value="">Select a Tenant</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    {errors.tenantId && <p className="mt-1 text-sm text-red-500">{errors.tenantId.message}</p>}
                </div>

                <Input
                    label="Role Name"
                    placeholder="e.g. Content Editor"
                    {...register('name')}
                    error={errors.name?.message}
                />

                <Input
                    label="Description (Optional)"
                    placeholder="Brief description of the role"
                    {...register('description')}
                />
            </div>

            <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Permissions</h3>
                {loadingConfig ? (
                    <div className="text-sm text-muted-foreground">Loading permissions...</div>
                ) : permissions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No permissions available.</div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {Object.entries(permissionsByResource).map(([resource, group]) => {
                            const groupIds = group.map(p => p.id);
                            const allSelected = groupIds.every(id => selectedPermissionIds.includes(id));

                            return (
                                <div key={resource} className="border border-border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                                        <span className="font-medium text-sm capitalize">{resource}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleResource(resource)}
                                            className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                                        >
                                            {allSelected ? 'Unselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {group.map(p => (
                                            <label key={p.id} className="flex items-start space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    checked={selectedPermissionIds.includes(p.id)}
                                                    onChange={() => togglePermission(p.id)}
                                                />
                                                <div className="text-xs">
                                                    <p className="font-medium text-foreground">{p.action}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {role ? 'Update Role' : 'Create Role'}
                </Button>
            </div>
        </form>
    );
}
