import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { roleService } from '../services/role.service';
import type { Role, CreateRoleDto } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dialog from '../components/ui/Dialog';
import RoleList from '../components/roles/RoleList';
import RoleForm from '../components/roles/RoleForm';

export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const data = await roleService.getAll();
            setRoles(data);
        } catch (err: any) {
            console.error('Failed to fetch roles:', err);
            setError('Failed to load roles. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleCreate = () => {
        setSelectedRole(undefined);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

        try {
            await roleService.delete(id);
            setRoles(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete role');
        }
    };

    const handleSubmit = async (data: CreateRoleDto) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (selectedRole) {
                const updated = await roleService.update(selectedRole.id, data);
                setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
            } else {
                const created = await roleService.create(data);
                setRoles(prev => [...prev, created]);
            }

            setIsDialogOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save role');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                    <p className="text-muted-foreground mt-1">Manage system roles and permissions.</p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus size={18} className="mr-2" />
                    New Role
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search roles..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <RoleList
                roles={filteredRoles}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedRole ? 'Edit Role' : 'Create New Role'}
                maxWidth="lg"
            >
                <RoleForm
                    role={selectedRole}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                    isLoading={isSubmitting}
                />
            </Dialog>
        </div>
    );
}
