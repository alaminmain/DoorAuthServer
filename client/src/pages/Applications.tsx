import { useState, useEffect } from 'react';
import { Plus, Search, Copy, Check } from 'lucide-react';
import { applicationService } from '../services/application.service';
import type { Application, CreateApplicationDto } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dialog from '../components/ui/Dialog';
import ApplicationList from '../components/applications/ApplicationList';
import ApplicationForm from '../components/applications/ApplicationForm';

export default function Applications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secretInfo, setSecretInfo] = useState<{ clientId: string; clientSecret: string } | null>(null);
    const [copiedField, setCopiedField] = useState<'clientId' | 'clientSecret' | null>(null);

    const fetchApplications = async () => {
        try {
            setIsLoading(true);
            const data = await applicationService.getAll();
            setApplications(data);
        } catch (err: any) {
            console.error('Failed to fetch applications:', err);
            setError('Failed to load applications. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleCreate = () => {
        setSelectedApp(undefined);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleEdit = (app: Application) => {
        setSelectedApp(app);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) return;

        try {
            await applicationService.delete(id);
            setApplications(prev => prev.filter(app => app.id !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete application');
        }
    };

    const handleSubmit = async (data: CreateApplicationDto) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (selectedApp) {
                const updated = await applicationService.update(selectedApp.id, data);
                setApplications(prev => prev.map(app => app.id === updated.id ? updated : app));
            } else {
                const created = await applicationService.create(data);
                setApplications(prev => [...prev, created]);
                if (created.clientSecret) {
                    setSecretInfo({
                        clientId: created.clientId,
                        clientSecret: created.clientSecret
                    });
                }
            }

            setIsDialogOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save application');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegenerateSecret = async (id: string) => {
        if (!window.confirm('Are you sure? The old secret will stop working immediately.')) return;

        try {
            const { clientSecret } = await applicationService.regenerateSecret(id);
            const app = applications.find(a => a.id === id);
            if (app) {
                setSecretInfo({
                    clientId: app.clientId,
                    clientSecret: clientSecret
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to regenerate secret');
        }
    };

    const handleCopy = async (text: string, field: 'clientId' | 'clientSecret') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const filteredApps = applications.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.clientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                    <p className="text-muted-foreground mt-1">Manage OIDC applications and clients.</p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus size={18} className="mr-2" />
                    New Application
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search applications..."
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

            <ApplicationList
                applications={filteredApps}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRegenerateSecret={handleRegenerateSecret}
                isLoading={isLoading}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedApp ? 'Edit Application' : 'Create New Application'}
                maxWidth="lg"
            >
                <ApplicationForm
                    application={selectedApp}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                    isLoading={isSubmitting}
                />
            </Dialog>

            <Dialog
                isOpen={!!secretInfo}
                onClose={() => setSecretInfo(null)}
                title="Application Credentials"
                maxWidth="md"
            >
                {secretInfo && (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 text-yellow-800 dark:text-yellow-400 p-4 rounded-lg text-sm">
                            <p className="font-semibold mb-1">⚠️ Important</p>
                            <p>Please copy the Client Secret now. It will not be shown again for security reasons.</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-2">Client ID</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={secretInfo.clientId}
                                        readOnly
                                        className="flex-1 font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleCopy(secretInfo.clientId, 'clientId')}
                                        className="px-3"
                                    >
                                        {copiedField === 'clientId' ? (
                                            <Check size={18} className="text-green-600" />
                                        ) : (
                                            <Copy size={18} />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Client Secret</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={secretInfo.clientSecret}
                                        readOnly
                                        className="flex-1 font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleCopy(secretInfo.clientSecret, 'clientSecret')}
                                        className="px-3"
                                    >
                                        {copiedField === 'clientSecret' ? (
                                            <Check size={18} className="text-green-600" />
                                        ) : (
                                            <Copy size={18} />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={() => setSecretInfo(null)}>
                                I've Saved the Credentials
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
