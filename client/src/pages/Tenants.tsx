import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { tenantService } from '../services/tenant.service';
import type { Tenant, CreateTenantDto } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dialog from '../components/ui/Dialog';
import TenantList from '../components/tenants/TenantList';
import TenantForm from '../components/tenants/TenantForm';

export default function Tenants() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTenants = async () => {
        try {
            setIsLoading(true);
            const data = await tenantService.getAll();
            setTenants(data);
        } catch (err: any) {
            console.error('Failed to fetch tenants:', err);
            setError('Failed to load tenants. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleCreate = () => {
        setSelectedTenant(undefined);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleEdit = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;

        try {
            await tenantService.delete(id);
            setTenants(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete tenant');
        }
    };

    const handleSubmit = async (data: CreateTenantDto) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (selectedTenant) {
                const updated = await tenantService.update(selectedTenant.id, data);
                setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
            } else {
                const created = await tenantService.create(data);
                setTenants(prev => [...prev, created]);
            }

            setIsDialogOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save tenant');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
                    <p className="text-muted-foreground mt-1">Manage organizations and their configuration.</p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus size={18} className="mr-2" />
                    New Tenant
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tenants..."
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

            <TenantList
                tenants={filteredTenants}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedTenant ? 'Edit Tenant' : 'Create New Tenant'}
            >
                <TenantForm
                    tenant={selectedTenant}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                    isLoading={isSubmitting}
                />
            </Dialog>
        </div>
    );
}
