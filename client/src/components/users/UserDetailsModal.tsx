import { useState, useEffect } from 'react';
import { Lock, Unlock, Key, Mail, History, X } from 'lucide-react';
import type { User, ActivityLog } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { userService } from '../../services/user.service';
import { formatDate } from '../../utils/date';
import { useToast } from '../../contexts/ToastContext';
import { confirmDialog } from '../../utils/sweetalert';

interface UserDetailsModalProps {
    user: User;
    onClose: () => void;
    onUpdate: () => void;
}

export default function UserDetailsModal({ user: initialUser, onClose, onUpdate }: UserDetailsModalProps) {
    const [user, setUser] = useState<User>(initialUser);
    const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [logsLoaded, setLogsLoaded] = useState(false);

    const toast = useToast();

    // Update local user state when prop changes
    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    const refreshUser = async () => {
        try {
            const updated = await userService.getById(user.id);
            setUser(updated);
            onUpdate(); // Also update parent list
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            toast.error('Password must be at least 6 characters');
            return;
        }

        const confirmed = await confirmDialog(
            'Reset Password?',
            'Are you sure you want to reset this user\'s password?',
            'Yes, reset',
            'Cancel'
        );
        if (!confirmed) return;

        try {
            setIsLoading(true);
            setError(null);
            await userService.resetPassword(user.id, newPassword);
            setSuccess('Password reset successfully');
            setNewPassword('');
            toast.success('Password reset successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
            toast.error(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendResetLink = async () => {
        const confirmed = await confirmDialog(
            'Send Reset Link?',
            `Send password reset link to ${user.email}?`,
            'Yes, send',
            'Cancel'
        );
        if (!confirmed) return;

        try {
            setIsLoading(true);
            setError(null);
            await userService.sendResetPasswordLink(user.id, user.email);
            setSuccess('Password reset link sent successfully');
            toast.success('Password reset link sent successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link');
            toast.error(err.message || 'Failed to send reset link');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleLock = async () => {
        const newStatus = !user.isLocked;

        const confirmed = await confirmDialog(
            `${newStatus ? 'Lock' : 'Unlock'} User?`,
            `Are you sure you want to ${newStatus ? 'lock' : 'unlock'} this user?`,
            `Yes, ${newStatus ? 'lock' : 'unlock'}`,
            'Cancel'
        );
        if (!confirmed) return;

        try {
            setIsLoading(true);
            setError(null);
            await userService.changeLockStatus(user.id, newStatus);
            setSuccess(`User ${newStatus ? 'locked' : 'unlocked'} successfully`);
            toast.success(`User ${newStatus ? 'locked' : 'unlocked'} successfully`);
            await refreshUser(); // Refresh user state
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update lock status');
            toast.error(err.message || 'Failed to update lock status');
        } finally {
            setIsLoading(false);
        }
    };

    const loadActivityLogs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const logs = await userService.getActivityLogs(user.id);
            setActivityLogs(logs);
            setLogsLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load activity logs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (tab: 'info' | 'security' | 'activity') => {
        setActiveTab(tab);
        setError(null);
        if (tab === 'activity' && !logsLoaded) {
            loadActivityLogs();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold">{user.userName}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => handleTabChange('info')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'info'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Information
                    </button>
                    <button
                        onClick={() => handleTabChange('security')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'security'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Security
                    </button>
                    <button
                        onClick={() => handleTabChange('activity')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'activity'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Activity
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Login ID</label>
                                    <p className="mt-1 text-foreground">{user.loginId}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                    <p className="mt-1 text-foreground">{user.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                                    <p className="mt-1 text-foreground">{user.companyName || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Designation</label>
                                    <p className="mt-1 text-foreground">{user.designation || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1 flex gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${user.isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                            {user.isApproved ? 'Approved' : 'Pending'}
                                        </span>
                                        {user.isLocked && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">2FA</label>
                                    <p className="mt-1 text-foreground">{user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* Lock/Unlock */}
                            <div className="border border-border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium flex items-center gap-2">
                                            {user.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                                            Account Lock Status
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {user.isLocked
                                                ? 'This account is currently locked and cannot sign in.'
                                                : 'This account is active and can sign in.'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleToggleLock}
                                        variant={user.isLocked ? 'default' : 'destructive'}
                                        isLoading={isLoading}
                                        className="ml-4"
                                    >
                                        {user.isLocked ? 'Unlock' : 'Lock'} Account
                                    </Button>
                                </div>
                            </div>

                            {/* Reset Password */}
                            <div className="border border-border rounded-lg p-4">
                                <h3 className="font-medium flex items-center gap-2 mb-3">
                                    <Key size={18} />
                                    Reset Password
                                </h3>
                                <div className="space-y-3">
                                    <Input
                                        type="password"
                                        placeholder="Enter new password (min 6 characters)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <Button
                                        onClick={handleResetPassword}
                                        isLoading={isLoading}
                                        disabled={!newPassword}
                                        className="w-full"
                                    >
                                        Reset Password
                                    </Button>
                                </div>
                            </div>

                            {/* Send Reset Link */}
                            <div className="border border-border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium flex items-center gap-2">
                                            <Mail size={18} />
                                            Send Password Reset Link
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Send a password reset link to {user.email}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleSendResetLink}
                                        variant="outline"
                                        isLoading={isLoading}
                                        className="ml-4"
                                    >
                                        Send Link
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="space-y-3">
                            <h3 className="font-medium flex items-center gap-2 mb-4">
                                <History size={18} />
                                Recent Activity (Last 10)
                            </h3>
                            {isLoading && !logsLoaded ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Loading activity logs...
                                </div>
                            ) : activityLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No activity logs found.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activityLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{log.action}</span>
                                                        <span className="text-xs text-muted-foreground">on</span>
                                                        <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">
                                                            {log.resource}
                                                        </span>
                                                    </div>
                                                    {log.details && (
                                                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                                                    )}
                                                    {log.ipAddress && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            IP: {log.ipAddress}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                                    {formatDate(log.timestamp, 'PPp')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-border">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
