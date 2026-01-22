import { Edit, Trash2, Building2, Users, Network } from 'lucide-react';
import type { Organization } from '../../types';
import Button from '../ui/Button';

interface OrganizationListProps {
    organizations: Organization[];
    onEdit: (org: Organization) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

export default function OrganizationList({ organizations, onEdit, onDelete, isLoading }: OrganizationListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (organizations.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-secondary">
                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>No organizations found. Create your first organization to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
                <div
                    key={org.id}
                    className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onEdit(org)}
                            title="Edit Organization"
                        >
                            <Edit size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => onDelete(org.id)}
                            title="Delete Organization"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>

                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <Building2 size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base">{org.name}</h3>
                            {org.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {org.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-2">
                        {org.parent && (
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Network size={12} className="mr-1.5" />
                                Parent: {org.parent.name}
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs">
                            <div className="flex items-center text-muted-foreground">
                                <Building2 size={12} className="mr-1.5" />
                                <span className="font-medium">{org._count?.children || 0}</span>
                                <span className="ml-1">Sub-orgs</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <Users size={12} className="mr-1.5" />
                                <span className="font-medium">{org._count?.users || 0}</span>
                                <span className="ml-1">Users</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Level {org.level}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
