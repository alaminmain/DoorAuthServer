import { useState } from 'react';
import { Shield, Mail, Key, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import TwoFactorSetup from '../components/auth/TwoFactorSetup';
import Disable2FA from '../components/auth/Disable2FA';
import TwoFactorStatus from '../components/auth/TwoFactorStatus';
import VerificationStatus from '../components/auth/VerificationStatus';

type SecurityView = 'main' | '2fa-setup' | '2fa-disable';

export default function Security() {
    const { user } = useAuth();
    const [view, setView] = useState<SecurityView>('main');

    const handle2FAComplete = () => {
        setView('main');
        // Force refresh to update user state
        window.location.reload();
    };

    if (view === '2fa-setup') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
                    <p className="text-muted-foreground">Set up two-factor authentication</p>
                </div>

                <Card className="max-w-lg">
                    <CardContent className="pt-6">
                        <TwoFactorSetup
                            onComplete={handle2FAComplete}
                            onCancel={() => setView('main')}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (view === '2fa-disable') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
                    <p className="text-muted-foreground">Disable two-factor authentication</p>
                </div>

                <Card className="max-w-lg">
                    <CardContent className="pt-6">
                        <Disable2FA
                            onComplete={handle2FAComplete}
                            onCancel={() => setView('main')}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
                <p className="text-muted-foreground">Manage your account security and authentication methods</p>
            </div>

            {/* Two-Factor Authentication Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                                <CardDescription>
                                    Add an extra layer of security to your account
                                </CardDescription>
                            </div>
                        </div>
                        <TwoFactorStatus enabled={user?.isTwoFactorEnabled || false} size="md" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">
                                {user?.isTwoFactorEnabled
                                    ? 'Your account is protected with 2FA'
                                    : 'Protect your account with 2FA'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {user?.isTwoFactorEnabled
                                    ? 'A verification code is required when signing in'
                                    : 'Use an authenticator app for additional security'}
                            </p>
                        </div>
                        {user?.isTwoFactorEnabled ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setView('2fa-disable')}
                            >
                                Disable
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setView('2fa-setup')}
                            >
                                Enable
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Email Verification Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Mail className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Email Verification</CardTitle>
                                <CardDescription>
                                    Verify your email address for account recovery
                                </CardDescription>
                            </div>
                        </div>
                        <VerificationStatus verified={user?.emailVerified || false} size="md" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">{user?.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {user?.emailVerified
                                    ? 'Your email is verified'
                                    : 'Please verify your email address'}
                            </p>
                        </div>
                        {!user?.emailVerified && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = '/verify-email'}
                            >
                                Verify Email
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Password Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <Key className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Password</CardTitle>
                            <CardDescription>
                                Change your password or set up password recovery
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">Password</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Last changed: Unknown
                            </p>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                            Change Password
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">User ID</span>
                            <span className="font-mono">{user?.id}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Login ID</span>
                            <span>{user?.loginId}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Username</span>
                            <span>{user?.userName}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-muted-foreground">Last Login</span>
                            <span>{user?.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : 'N/A'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
