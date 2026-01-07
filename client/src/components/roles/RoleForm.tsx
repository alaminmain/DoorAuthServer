import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Role, CreateRoleDto, Tenant, Permission, Application, Menu } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { tenantService } from '../../services/tenant.service';
import { roleService } from '../../services/role.service';
import { applicationService } from '../../services/application.service';
import { menuService } from '../../services/menu.service';

const roleSchema = z.object({
    tenantId: z.string().min(1, 'Tenant is required'),
    applicationId: z.string().optional(),
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
    const [applications, setApplications] = useState<Application[]>([]);
    const [menus, setMenus] = useState<Menu[]>([]);
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
            applicationId: '',
            name: '',
            description: '',
            permissionIds: [],
        },
    });

    const selectedPermissionIds = watch('permissionIds') || [];
    const selectedTenantId = watch('tenantId');
    const selectedApplicationId = watch('applicationId');

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
        if (selectedTenantId) {
            applicationService.getAll(selectedTenantId).then(setApplications).catch(console.error);
        } else {
            setApplications([]);
        }
    }, [selectedTenantId]);

    useEffect(() => {
        if (selectedApplicationId) {
            menuService.getAll(selectedApplicationId).then(setMenus).catch(console.error);
        } else {
            setMenus([]);
        }
    }, [selectedApplicationId]);

    useEffect(() => {
        if (role) {
            // First set the tenant and application IDs to trigger loading
            setValue('tenantId', role.tenantId);
            if (role.applicationId) {
                setValue('applicationId', role.applicationId);
            }

            // Then reset the entire form
            reset({
                tenantId: role.tenantId,
                applicationId: role.applicationId || '',
                name: role.name,
                description: role.description || '',
                permissionIds: role.permissions?.map(p => `${p.resource}:${p.action}`) || [],
            });
        }
    }, [role, reset, setValue]);

    const permissionsByResource = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        permissions.forEach(p => {
            if (!groups[p.resource]) groups[p.resource] = [];
            groups[p.resource].push(p);
        });
        return groups;
    }, [permissions]);

    const getMenuResource = (menu: Menu) => {
        // Use requiredPermission if set, otherwise normalize the label
        return menu.requiredPermission || menu.label.toLowerCase().replace(/\s+/g, '-');
    };

    const togglePermission = (id: string) => {
        const current = selectedPermissionIds;
        const isSelected = current.includes(id);

        if (isSelected) {
            setValue('permissionIds', current.filter(pid => pid !== id));
        } else {
            // If requested, we could ensure mutual exclusivity, but for roles typically we want additive
            setValue('permissionIds', [...current, id]);
        }
    };

    const toggleResource = (resource: string) => {
        const group = permissionsByResource[resource] || [];
        const groupIds = group.map(p => `${p.resource}:${p.action}`);
        const allSelected = groupIds.every(id => selectedPermissionIds.includes(id));

        if (allSelected) {
            setValue('permissionIds', selectedPermissionIds.filter(id => !groupIds.includes(id)));
        } else {
            const newIds = Array.from(new Set([...selectedPermissionIds, ...groupIds]));
            setValue('permissionIds', newIds);
        }
    };

    const isMenuPermSelected = (menu: Menu, action: 'read' | 'write') => {
        const resource = getMenuResource(menu);
        return selectedPermissionIds.includes(`${resource}:${action}`);
    };

    const toggleMenuPerm = (menu: Menu, action: 'read' | 'write') => {
        const resource = getMenuResource(menu);
        const permId = `${resource}:${action}`;
        togglePermission(permId);
    };

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data as CreateRoleDto))} className="space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tenant</label>
                        <select
                            {...register('tenantId')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                            disabled={!!role}
                        >
                            <option value="">Select a Tenant</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {errors.tenantId && <p className="mt-1 text-sm text-red-500">{errors.tenantId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Application (Optional)</label>
                        <select
                            {...register('applicationId')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                        >
                            <option value="">All Applications</option>
                            {applications.map(app => (
                                <option key={app.id} value={app.id}>{app.name}</option>
                            ))}
                        </select>
                    </div>
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

            {/* Menu Permissions Section */}
            {selectedApplicationId && menus.length > 0 && (
                <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-medium text-foreground mb-4">Page Access Permissions</h3>
                    <div className="border rounded-md divide-y divide-border">
                        <div className="bg-secondary/20 p-3 grid grid-cols-12 gap-4 font-medium text-xs">
                            <div className="col-span-8">Menu / Page</div>
                            <div className="col-span-2 text-center">Read</div>
                            <div className="col-span-2 text-center">Write</div>
                        </div>
                        {menus.map((menu) => (
                            <div key={menu.id} className="p-3 grid grid-cols-12 gap-4 items-center text-sm">
                                <div className="col-span-8 flex flex-col">
                                    <span className="font-medium">{menu.label}</span>
                                    <span className="text-xs text-muted-foreground font-mono">{menu.path || 'No Path'}</span>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={isMenuPermSelected(menu, 'read')}
                                        onChange={() => toggleMenuPerm(menu, 'read')}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={isMenuPermSelected(menu, 'write')}
                                        onChange={() => toggleMenuPerm(menu, 'write')}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Advanced Permissions</h3>
                {loadingConfig ? (
                    <div className="text-sm text-muted-foreground">Loading permissions...</div>
                ) : permissions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No predefined permissions found. Use the menu above to assign access.</div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {Object.entries(permissionsByResource).map(([resource, group]) => {
                            const groupIds = group.map(p => `${p.resource}:${p.action}`);
                            const allSelected = groupIds.every(id => selectedPermissionIds.includes(id));

                            return (
                                <div key={resource} className="border border-border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                                        <span className="font-medium text-sm capitalize">{resource}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleResource(resource)}
                                            className="text-xs text-primary hover:text-primary/80 font-medium"
                                        >
                                            {allSelected ? 'Unselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {group.map(p => {
                                            const pid = `${p.resource}:${p.action}`;
                                            return (
                                                <label key={pid} className="flex items-start space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                                                        checked={selectedPermissionIds.includes(pid)}
                                                        onChange={() => togglePermission(pid)}
                                                    />
                                                    <div className="text-xs">
                                                        <p className="font-medium text-foreground">{p.action}</p>
                                                        <p className="text-muted-foreground text-[10px]">{p.description}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
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
