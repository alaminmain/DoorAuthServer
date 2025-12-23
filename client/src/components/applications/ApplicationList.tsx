import { Edit, Trash2, AppWindow, Copy, Key } from 'lucide-react';
import type { Application } from '../../types';
import { formatDate, copyToClipboard } from '../../utils/helpers';
import Button from '../ui/Button';

interface ApplicationListProps {
    applications: Application[];
    onEdit: (app: Application) => void;
    onDelete: (id: string) => void;
    onRegenerateSecret: (id: string) => void;
    isLoading?: boolean;
}

export default function ApplicationList({ applications, onEdit, onDelete, onRegenerateSecret, isLoading }: ApplicationListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-secondary/50 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-secondary">
                <p>No applications found. Create your first application to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {applications.map((app) => (
                <div
                    key={app.id}
                    className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <AppWindow size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg leading-none">{app.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${app.status === 'active'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {app.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary-500"
                                onClick={() => onEdit(app)}
                                title="Edit Application"
                            >
                                <Edit size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={() => onDelete(app.id)}
                                title="Delete Application"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 mb-4 flex-1">
                        <div className="text-sm">
                            <p className="text-muted-foreground text-xs mb-1">Client ID</p>
                            <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded font-mono text-xs">
                                <span className="truncate flex-1">{app.clientId}</span>
                                <button onClick={() => copyToClipboard(app.clientId)} className="text-muted-foreground hover:text-primary-500">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => onRegenerateSecret(app.id)}
                            >
                                <Key size={12} className="mr-1" /> Secret
                            </Button>
                        </div>
                        <div>
                            Created {formatDate(app.createdAt)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
