import { useState, useEffect } from 'react';
import { sessionService, type Session } from '../services/session.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trash2, Monitor, Smartphone, Tablet, Globe, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function Sessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await sessionService.getMySessions();
            setSessions(data);
        } catch (error: any) {
            toast.error('Failed to load sessions', {
                description: error.message || 'An error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeSession = async (sessionToken: string) => {
        try {
            await sessionService.revokeSession(sessionToken);
            toast.success('Session revoked successfully');
            loadSessions(); // Reload sessions
        } catch (error: any) {
            toast.error('Failed to revoke session', {
                description: error.message || 'An error occurred',
            });
        }
    };

    const handleRevokeAllSessions = async () => {
        if (!confirm('Are you sure you want to revoke all sessions? You will be logged out.')) {
            return;
        }

        try {
            const result = await sessionService.revokeAllMySessions();
            toast.success(`${result.count} session(s) revoked successfully`);
            // User will be logged out automatically
            window.location.href = '/login';
        } catch (error: any) {
            toast.error('Failed to revoke all sessions', {
                description: error.message || 'An error occurred',
            });
        }
    };

    const getDeviceIcon = (deviceInfo: string | null, browser: string | null) => {
        const info = (deviceInfo || '').toLowerCase();
        const browserInfo = (browser || '').toLowerCase();

        if (info.includes('mobile') || info.includes('phone')) {
            return <Smartphone className="h-5 w-5 text-blue-500" />;
        } else if (info.includes('tablet') || info.includes('ipad')) {
            return <Tablet className="h-5 w-5 text-green-500" />;
        } else {
            return <Monitor className="h-5 w-5 text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Active Sessions</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your active sessions across different devices
                    </p>
                </div>
                <Button
                    variant="destructive"
                    onClick={handleRevokeAllSessions}
                    disabled={sessions.length === 0}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke All Sessions
                </Button>
            </div>

            {sessions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Monitor className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No active sessions found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {sessions.map((session) => (
                        <Card key={session.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getDeviceIcon(session.deviceInfo, session.browser)}
                                        <div>
                                            <CardTitle className="text-lg">
                                                {session.browser || 'Unknown Browser'}
                                            </CardTitle>
                                            <CardDescription>
                                                {session.os || 'Unknown OS'} • {session.deviceInfo || 'Unknown Device'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRevokeSession(session.sessionToken)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Revoke
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        <span>{session.ipAddress || 'Unknown IP'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            Last active: {getTimeAgo(session.lastActivity)}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Globe className="h-4 w-4" />
                                        <span>
                                            Logged in: {formatDate(session.loginTime)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-gray-500">
                                    Expires: {formatDate(session.expiresAt)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900">Security Tip</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800">
                    <p>
                        If you see any sessions that you don't recognize, revoke them immediately and change your password.
                        Sessions automatically expire after 30 minutes of inactivity.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
