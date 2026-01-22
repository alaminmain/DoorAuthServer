import { useState, useEffect } from 'react';
import type { Organization, CreateOrganizationDto } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface OrganizationFormProps {
    organization?: Organization;
    organizations: Organization[];
    onSubmit: (data: CreateOrganizationDto) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function OrganizationForm({
    organization,
    organizations,
    onSubmit,
    onCancel,
    isLoading
}: OrganizationFormProps) {
    const [formData, setFormData] = useState<CreateOrganizationDto>({
        name: '',
        description: '',
        parentId: undefined
    });

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name,
                description: organization.description || '',
                parentId: organization.parentId || undefined
            });
        }
    }, [organization]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Filter out current organization and its descendants from parent options
    const availableParents = organizations.filter(org => {
        if (!organization) return true;
        if (org.id === organization.id) return false;
        // TODO: Also filter out descendants to prevent circular references
        return true;
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                    Organization Name <span className="text-red-500">*</span>
                </label>
                <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter organization name"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1.5">
                    Description
                </label>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter organization description"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
                />
            </div>

            <div>
                <label htmlFor="parentId" className="block text-sm font-medium mb-1.5">
                    Parent Organization
                </label>
                <select
                    id="parentId"
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">None (Root Level)</option>
                    {availableParents.map((org) => (
                        <option key={org.id} value={org.id}>
                            {'  '.repeat(org.level)}{org.name} (Level {org.level})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                    Select a parent organization to create a hierarchical structure
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                >
                    {isLoading ? 'Saving...' : organization ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
}
