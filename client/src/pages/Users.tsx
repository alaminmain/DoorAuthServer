import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { userService } from '../services/user.service';
import type { User, RegisterData } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dialog from '../components/ui/Dialog';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import UserDetailsModal from '../components/users/UserDetailsModal';

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [detailsUser, setDetailsUser] = useState<User | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await userService.getAll();
            setUsers(data);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(undefined);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleViewDetails = (user: User) => {
        setDetailsUser(user);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.delete(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
        }
    };

    const handleSubmit = async (data: RegisterData) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (selectedUser) {
                // Adapt RegisterData to Partial<User> for update
                const updateData: Partial<User> = {
                    userName: data.userName,
                    email: data.email,
                    companyName: data.companyName,
                    designation: data.designation
                };
                const updated = await userService.update(selectedUser.id, updateData);
                setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            } else {
                const created = await userService.create(data);
                setUsers(prev => [...prev, created]);
            }

            setIsDialogOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.loginId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-1">Manage system users and their access.</p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus size={18} className="mr-2" />
                    New User
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
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

            <UserList
                users={filteredUsers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                isLoading={isLoading}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedUser ? 'Edit User' : 'Create New User'}
                maxWidth="lg"
            >
                <UserForm
                    user={selectedUser}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                    isLoading={isSubmitting}
                />
            </Dialog>

            {detailsUser && (
                <UserDetailsModal
                    user={detailsUser}
                    onClose={() => setDetailsUser(undefined)}
                    onUpdate={fetchUsers}
                />
            )}
        </div>
    );
}
