import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Edit, Trash2, Users } from 'lucide-react';
import type { Organization } from '../../types';
import Button from '../ui/Button';

interface OrganizationTreeViewProps {
    organizations: Organization[];
    onEdit: (org: Organization) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

interface TreeNodeProps {
    organization: Organization;
    onEdit: (org: Organization) => void;
    onDelete: (id: string) => void;
    level?: number;
}

function TreeNode({ organization, onEdit, onDelete, level = 0 }: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
    const hasChildren = organization.children && organization.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 p-3 rounded-lg hover:bg-secondary/50 transition-colors group ${level > 0 ? 'ml-6' : ''
                    }`}
            >
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-secondary transition-colors ${!hasChildren ? 'invisible' : ''
                        }`}
                >
                    {hasChildren && (
                        isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                </button>

                <div className={`p-2 rounded-full ${level === 0
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : level === 1
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}>
                    <Building2 size={16} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{organization.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex-shrink-0">
                            Level {organization.level}
                        </span>
                    </div>
                    {organization.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {organization.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                    <div className="flex items-center gap-1">
                        <Building2 size={12} />
                        <span>{organization._count?.children || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{organization._count?.users || 0}</span>
                    </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(organization);
                        }}
                        title="Edit Organization"
                    >
                        <Edit size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(organization.id);
                        }}
                        title="Delete Organization"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="ml-3 border-l-2 border-secondary">
                    {organization.children!.map((child) => (
                        <TreeNode
                            key={child.id}
                            organization={child}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function OrganizationTreeView({
    organizations,
    onEdit,
    onDelete,
    isLoading
}: OrganizationTreeViewProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
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
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-1">
                {organizations.map((org) => (
                    <TreeNode
                        key={org.id}
                        organization={org}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}
