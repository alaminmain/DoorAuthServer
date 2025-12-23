import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { menuService } from '../services/menu.service';
import { applicationService } from '../services/application.service';
import type { Menu, CreateMenuDto, Application } from '../types';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import MenuList from '../components/menus/MenuList';
import MenuForm from '../components/menus/MenuForm';

export default function Menus() {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedAppId, setSelectedAppId] = useState<string>('');

    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load apps
        applicationService.getAll().then(data => {
            setApplications(data);
            if (data.length > 0) setSelectedAppId(data[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedAppId) {
            loadMenus(selectedAppId);
        } else {
            setMenus([]);
        }
    }, [selectedAppId]);

    const loadMenus = async (appId: string) => {
        try {
            setIsLoading(true);
            const data = await menuService.getAll(appId);
            setMenus(data);
        } catch (err) {
            console.error('Failed to load menus', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedMenu(undefined);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleEdit = (menu: Menu) => {
        setSelectedMenu(menu);
        setIsDialogOpen(true);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this menu item? Children will be orphaned (or deleted).')) return;
        try {
            await menuService.delete(id);
            setMenus(prev => prev.filter(m => m.id !== id));
        } catch (err: any) {
            alert('Failed to delete menu');
        }
    };

    const handleSubmit = async (data: CreateMenuDto) => {
        try {
            setIsSubmitting(true);
            if (selectedMenu) {
                const updated = await menuService.update(selectedMenu.id, data);
                setMenus(prev => prev.map(m => m.id === updated.id ? updated : m));
            } else {
                const created = await menuService.create(data);
                setMenus(prev => [...prev, created]);
            }
            setIsDialogOpen(false);
            // Refresh to ensure order/parenting is correct if needed, but optimistic update is fine
            if (selectedAppId) loadMenus(selectedAppId);
        } catch (err: any) {
            setError(err.message || 'Failed to save menu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Menu Builder</h1>
                    <p className="text-muted-foreground mt-1">Configure application navigation menus.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        value={selectedAppId}
                        onChange={(e) => setSelectedAppId(e.target.value)}
                    >
                        <option value="">Select Application</option>
                        {applications.map(app => (
                            <option key={app.id} value={app.id}>{app.name}</option>
                        ))}
                    </select>
                    <Button onClick={handleCreate} disabled={!selectedAppId}>
                        <Plus size={18} className="mr-2" />
                        Add Menu Item
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <MenuList
                menus={menus}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedMenu ? 'Edit Menu Item' : 'Add Menu Item'}
            >
                <MenuForm
                    menu={selectedMenu}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                    isLoading={isSubmitting}
                />
            </Dialog>
        </div>
    );
}
