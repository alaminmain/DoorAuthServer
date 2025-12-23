import { useMemo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Menu } from '../../types';
import Button from '../ui/Button';
import { cn } from '../../utils/helpers';

interface MenuListProps {
    menus: Menu[];
    onEdit: (menu: Menu) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

interface TreeNode extends Menu {
    children?: TreeNode[];
}

const buildTree = (items: Menu[]): TreeNode[] => {
    const rootItems: TreeNode[] = [];
    const lookup: Record<string, TreeNode> = {};

    for (const item of items) {
        lookup[item.id] = { ...item, children: [] };
    }

    for (const item of items) {
        if (item.parentId && lookup[item.parentId]) {
            lookup[item.parentId].children?.push(lookup[item.id]);
        } else {
            rootItems.push(lookup[item.id]);
        }
    }

    // Sort by order
    const sortNodes = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => a.order - b.order);
        nodes.forEach(node => {
            if (node.children) sortNodes(node.children);
        });
    };

    sortNodes(rootItems);
    return rootItems;
};

const MenuNode = ({ node, level, onEdit, onDelete }: { node: TreeNode; level: number; onEdit: (m: Menu) => void; onDelete: (id: string) => void }) => {
    return (
        <div className="mb-2">
            <div
                className={cn(
                    "flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors",
                    level > 0 && "ml-6 border-l-4 border-l-primary-500/20"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="text-muted-foreground w-6 text-center text-sm font-mono">{node.order}</div>
                    <div>
                        <h4 className="font-medium text-sm">{node.label}</h4>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                            {node.path && <span className="bg-secondary px-1.5 py-0.5 rounded">{node.path}</span>}
                            {node.requiredPermission && <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded">{node.requiredPermission}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(node)}>
                        <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(node.id)}>
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>

            {node.children && node.children.length > 0 && (
                <div className="mt-2 border-l border-border/50 ml-3 pl-1">
                    {node.children.map(child => (
                        <MenuNode key={child.id} node={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};


export default function MenuList({ menus, onEdit, onDelete, isLoading }: MenuListProps) {
    const tree = useMemo(() => buildTree(menus), [menus]);

    if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading menus...</div>;
    if (!menus.length) return <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-secondary/10">No menus found. Select an application to view menus.</div>;

    return (
        <div className="space-y-2">
            {tree.map(node => (
                <MenuNode key={node.id} node={node} level={0} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </div>
    );
}
