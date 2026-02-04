import { useState } from 'react';
import {
    Edit,
    Trash2,
    Mail,
    Building,
    User as UserIcon,
    Eye,
    Grid,
    List,
    CheckCircle,
    KeyRound,
    Shield,
    Clock
} from 'lucide-react';
import type { User } from '../../types';
import Button from '../ui/Button';

interface UserListProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
    onViewDetails: (user: User) => void;
    onVerifyUser?: (userId: string) => void;
    onSendPasswordRecovery?: (userId: string) => void;
    isSuperAdmin?: boolean;
    isLoading?: boolean;
}

type ViewMode = 'grid' | 'list';

export default function UserList({
    users,
    onEdit,
    onDelete,
    onViewDetails,
    onVerifyUser,
    onSendPasswordRecovery,
    isSuperAdmin = false,
    isLoading
}: UserListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
        <div>
            {/* View Toggle */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                    {users.length} user{users.length !== 1 ? 's' : ''} found
                </p>
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <Grid size={16} />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <List size={16} />
                    </Button>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                        <UserGridCard
                            key={user.id}
                            user={user}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onViewDetails={onViewDetails}
                            onVerifyUser={onVerifyUser}
                            onSendPasswordRecovery={onSendPasswordRecovery}
                            isSuperAdmin={isSuperAdmin}
                        />
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roles</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verified</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user) => (
                                    <UserListRow
                                        key={user.id}
                                        user={user}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onViewDetails={onViewDetails}
                                        onVerifyUser={onVerifyUser}
                                        onSendPasswordRecovery={onSendPasswordRecovery}
                                        isSuperAdmin={isSuperAdmin}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Grid Card Component
interface UserCardProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
    onViewDetails: (user: User) => void;
    onVerifyUser?: (userId: string) => void;
    onSendPasswordRecovery?: (userId: string) => void;
    isSuperAdmin?: boolean;
}

function UserGridCard({
    user,
    onEdit,
    onDelete,
    onViewDetails,
    onVerifyUser,
    onSendPasswordRecovery,
    isSuperAdmin
}: UserCardProps) {
    return (
        <div className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow group relative overflow-hidden">
            {/* Action Buttons */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-wrap justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onViewDetails(user)}
                    title="View Details"
                >
                    <Eye size={16} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(user)}
                    title="Edit User"
                >
                    <Edit size={16} />
                </Button>
                {/* Verify Button - Only for Super Admin and unverified users */}
                {isSuperAdmin && !user.emailVerified && onVerifyUser && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-green-500"
                        onClick={() => onVerifyUser(user.id)}
                        title="Verify User"
                    >
                        <CheckCircle size={16} />
                    </Button>
                )}
                {/* Send Password Recovery */}
                {onSendPasswordRecovery && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-orange-500"
                        onClick={() => onSendPasswordRecovery(user.id)}
                        title="Send Password Recovery Email"
                    >
                        <KeyRound size={16} />
                    </Button>
                )}
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

            {/* User Info */}
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <UserIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base truncate">{user.userName}</h3>
                        {user.emailVerified && (
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0" title="Email Verified" />
                        )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <Mail size={10} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
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

                {/* Role Badges */}
                {user.roles && user.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {user.roles.map((userRole) => {
                            const isTenantAdmin = userRole.role.name === 'Tenant Admin';
                            return (
                                <span
                                    key={userRole.role.id}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isTenantAdmin
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-1 ring-purple-300 dark:ring-purple-700'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}
                                    title={isTenantAdmin ? 'Tenant Administrator' : userRole.role.name}
                                >
                                    {isTenantAdmin && '👑 '}
                                    {userRole.role.name}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Status Badges */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {user.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    {user.isLocked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Locked
                        </span>
                    )}
                    {!user.emailVerified && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Unverified
                        </span>
                    )}
                </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-right mt-2">
                Privileges: {user.isTwoFactorEnabled ? '2FA' : 'Basic'}
            </div>
        </div>
    );
}

// List Row Component
function UserListRow({
    user,
    onEdit,
    onDelete,
    onViewDetails,
    onVerifyUser,
    onSendPasswordRecovery,
    isSuperAdmin
}: UserCardProps) {
    return (
        <tr className="hover:bg-muted/30 transition-colors">
            {/* User */}
            <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <UserIcon size={16} />
                    </div>
                    <div>
                        <div className="font-medium text-sm">{user.userName}</div>
                        <div className="text-xs text-muted-foreground">{user.loginId}</div>
                    </div>
                </div>
            </td>

            {/* Email */}
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{user.email}</span>
                </div>
            </td>

            {/* Roles */}
            <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                        user.roles.slice(0, 2).map((userRole) => {
                            const isTenantAdmin = userRole.role.name === 'Tenant Admin';
                            return (
                                <span
                                    key={userRole.role.id}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isTenantAdmin
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}
                                >
                                    {isTenantAdmin && '👑 '}{userRole.role.name}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-xs text-muted-foreground">No roles</span>
                    )}
                    {user.roles && user.roles.length > 2 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            +{user.roles.length - 2}
                        </span>
                    )}
                </div>
            </td>

            {/* Status */}
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.isApproved
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {user.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    {user.isLocked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Locked
                        </span>
                    )}
                </div>
            </td>

            {/* Verified */}
            <td className="py-3 px-4">
                {user.emailVerified ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle size={14} />
                        <span className="text-xs font-medium">Verified</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <Clock size={14} />
                        <span className="text-xs font-medium">Pending</span>
                    </div>
                )}
            </td>

            {/* Actions */}
            <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onViewDetails(user)}
                        title="View Details"
                    >
                        <Eye size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onEdit(user)}
                        title="Edit User"
                    >
                        <Edit size={16} />
                    </Button>
                    {/* Verify Button - Only for Super Admin and unverified users */}
                    {isSuperAdmin && !user.emailVerified && onVerifyUser && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-green-500"
                            onClick={() => onVerifyUser(user.id)}
                            title="Verify User"
                        >
                            <Shield size={16} />
                        </Button>
                    )}
                    {/* Send Password Recovery */}
                    {onSendPasswordRecovery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-orange-500"
                            onClick={() => onSendPasswordRecovery(user.id)}
                            title="Send Password Recovery Email"
                        >
                            <KeyRound size={16} />
                        </Button>
                    )}
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
            </td>
        </tr>
    );
}
