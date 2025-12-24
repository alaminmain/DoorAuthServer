import { useState, useEffect } from 'react';
import { Search, UserPlus, X, Check } from 'lucide-react';
import { userService } from '../services/user.service';
import { roleService } from '../services/role.service';
import type { User, Role } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import apiService from '../services/api';

export default function UserRoles() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userRoles, setUserRoles] = useState<Role[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersData, rolesData] = await Promise.all([
                userService.getAll(),
                roleService.getAll()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (err: any) {
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserRoles = async (userId: string) => {
        try {
            const response = await apiService.get<Role[]>(`/users/${userId}/roles`);
            setUserRoles(response.data || []);
        } catch (err: any) {
            console.error('Failed to fetch user roles:', err);
            setUserRoles([]);
        }
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        fetchUserRoles(user.id);
        setError(null);
        setSuccess(null);
    };

    const handleAssignRole = async (roleId: string) => {
        if (!selectedUser) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await apiService.post(`/users/${selectedUser.id}/roles`, { roleId });
            await fetchUserRoles(selectedUser.id);
            setSuccess('Role assigned successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to assign role');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveRole = async (roleId: string) => {
        if (!selectedUser) return;
        if (!window.confirm('Are you sure you want to remove this role from the user?')) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await apiService.delete(`/users/${selectedUser.id}/roles/${roleId}`);
            await fetchUserRoles(selectedUser.id);
            setSuccess('Role removed successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to remove role');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.loginId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableRoles = roles.filter(r => !userRoles.some(ur => ur.id === r.id));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Role Assignment</h1>
                <p className="text-muted-foreground mt-1">Assign and manage user roles and permissions.</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg text-sm">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users List */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Select User</h2>

                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No users found</div>
                        ) : (
                            filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${selectedUser?.id === user.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                        }`}
                                >
                                    <div className="font-medium">{user.userName}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                    <div className="flex gap-2 mt-2">
                                        {user.isLocked && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                Locked
                                            </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${user.isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                            {user.isApproved ? 'Approved' : 'Pending'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Role Assignment */}
                <div className="bg-card border border-border rounded-lg p-6">
                    {!selectedUser ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                                <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Select a user to manage their roles</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">
                                    Roles for {selectedUser.userName}
                                </h2>
                                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                            </div>

                            {/* Assigned Roles */}
                            <div>
                                <h3 className="font-medium mb-3">Assigned Roles ({userRoles.length})</h3>
                                {userRoles.length === 0 ? (
                                    <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4 text-center">
                                        No roles assigned yet
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {userRoles.map((role) => (
                                            <div
                                                key={role.id}
                                                className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/20"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{role.name}</div>
                                                    {role.description && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {role.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => handleRemoveRole(role.id)}
                                                    disabled={isSubmitting}
                                                    title="Remove Role"
                                                >
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Available Roles */}
                            <div>
                                <h3 className="font-medium mb-3">Available Roles ({availableRoles.length})</h3>
                                {availableRoles.length === 0 ? (
                                    <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4 text-center">
                                        All roles have been assigned
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {availableRoles.map((role) => (
                                            <div
                                                key={role.id}
                                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{role.name}</div>
                                                    {role.description && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {role.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    onClick={() => handleAssignRole(role.id)}
                                                    disabled={isSubmitting}
                                                    title="Assign Role"
                                                >
                                                    <Check size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
