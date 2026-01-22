import { useState, useEffect } from 'react';
import { Plus, Search, Network } from 'lucide-react';
import { organizationService } from '../services/organization.service';
import type { Organization, CreateOrganizationDto } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dialog from '../components/ui/Dialog';
import OrganizationList from '../components/organizations/OrganizationList';
import OrganizationForm from '../components/organizations/OrganizationForm';
import OrganizationTreeView from '../components/organizations/OrganizationTreeView';
import { useToast } from '../contexts/ToastContext';
import { confirmDelete } from '../utils/sweetalert';

export default function Organizations() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Organization | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    const toast = useToast();

    const fetchOrganizations = async () => {
        try {
            setIsLoading(true);
            const data = await organizationService.getAll();
            setOrganizations(data);
        } catch (err: any) {
            console.error('Failed to fetch organizations:', err);
            setError('Failed to load organizations. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const handleCreate = () => {
        setSelectedOrg(undefined);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleEdit = (org: Organization) => {
        setSelectedOrg(org);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDelete('this organization');
        if (!confirmed) return;

        try {
            await organizationService.delete(id);
            setOrganizations(prev => prev.filter(o => o.id !== id));
            toast.success('Organization deleted successfully');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to delete organization';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleSubmit = async (data: CreateOrganizationDto) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (selectedOrg) {
                const updated = await organizationService.update(selectedOrg.id, data);
                setOrganizations(prev => prev.map(o => o.id === updated.id ? updated : o));
                toast.success('Organization updated successfully');
            } else {
                const created = await organizationService.create(data);
                setOrganizations(prev => [...prev, created]);
                toast.success('Organization created successfully');
            }

            setIsDialogOpen(false);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save organization';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredOrganizations = organizations.filter(o =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.description && o.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Build tree structure for tree view
    const buildTree = (orgs: Organization[]): Organization[] => {
        const orgMap = new Map<string, Organization>();
        const roots: Organization[] = [];

        // First pass: create map
        orgs.forEach(org => {
            orgMap.set(org.id, { ...org, children: [] });
        });

        // Second pass: build tree
        orgs.forEach(org => {
            const node = orgMap.get(org.id)!;
            if (org.parentId) {
                const parent = orgMap.get(org.parentId);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        });

        return roots;
    };

    const treeData = buildTree(filteredOrganizations);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground mt-1">Manage organizational hierarchy and structure.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        onClick={() => setViewMode('list')}
                        className="w-auto"
                    >
                        List View
                    </Button>
                    <Button
                        variant={viewMode === 'tree' ? 'default' : 'outline'}
                        onClick={() => setViewMode('tree')}
                        className="w-auto"
                    >
                        <Network size={18} className="mr-2" />
                        Tree View
                    </Button>
                    <Button onClick={handleCreate} className="w-full sm:w-auto">
                        <Plus size={18} className="mr-2" />
                        New Organization
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations..."
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

            {viewMode === 'list' ? (
                <OrganizationList
                    organizations={filteredOrganizations}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                />
            ) : (
                <OrganizationTreeView
                    organizations={treeData}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                />
            )}

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedOrg ? 'Edit Organization' : 'Create New Organization'}
                maxWidth="lg"
            >
                <OrganizationForm
                    organization={selectedOrg}
                    organizations={organizations}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                    isLoading={isSubmitting}
                />
            </Dialog>
        </div>
    );
}
