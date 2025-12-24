import { Edit, Trash2, Globe, Calendar } from 'lucide-react';
import type { Tenant } from '../../types';
import { formatDate } from '../../utils/helpers';
import Button from '../ui/Button';

interface TenantListProps {
    tenants: Tenant[];
    onEdit: (tenant: Tenant) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

export default function TenantList({ tenants, onEdit, onDelete, isLoading }: TenantListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-secondary/50 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-secondary">
                <p>No tenants found. Create your first tenant to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
                <div
                    key={tenant.id}
                    className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onEdit(tenant)}
                            title="Edit Tenant"
                        >
                            <Edit size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => onDelete(tenant.id)}
                            title="Delete Tenant"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>

                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary">
                            <Globe size={24} />
                        </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-1">{tenant.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{tenant.domain}</p>

                    <div className="flex items-center text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
                        <Calendar size={14} className="mr-1.5" />
                        Created {formatDate(tenant.createdAt)}
                    </div>
                </div>
            ))}
        </div>
    );
}
