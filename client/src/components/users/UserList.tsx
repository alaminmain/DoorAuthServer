import { Edit, Trash2, Mail, Building, User as UserIcon } from 'lucide-react';
import type { User } from '../../types';
import Button from '../ui/Button';

interface UserListProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

export default function UserList({ users, onEdit, onDelete, isLoading }: UserListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-secondary">
                <p>No users found. Create your first user to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
                <div
                    key={user.id}
                    className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary-500"
                            onClick={() => onEdit(user)}
                            title="Edit User"
                        >
                            <Edit size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => onDelete(user.id)}
                            title="Delete User"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>

                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">{user.userName}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                <Mail size={10} className="mr-1" />
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-2">
                        {user.tenantId && (
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Building size={12} className="mr-1.5" />
                                Tenant ID: {user.tenantId.substring(0, 8)}...
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                {user.isApproved ? 'Approved' : 'Pending'}
                            </span>
                            {user.isLocked && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    Locked
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground text-right mt-2">
                        Privileges: {user.isTwoFactorEnabled ? '2FA' : 'Basic'}
                    </div>
                </div>
            ))}
        </div>
    );
}
