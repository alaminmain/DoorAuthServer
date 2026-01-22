import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    AppWindow,
    Shield,
    MenuSquare,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Network
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Tenants', path: '/tenants', icon: Building2, superAdminOnly: true }, // Only for Super Admins
    { label: 'Applications', path: '/applications', icon: AppWindow },
    { label: 'Roles & Permissions', path: '/roles', icon: Shield },
    { label: 'Menu Builder', path: '/menus', icon: MenuSquare },
    { label: 'Users', path: '/users', icon: Users },
    { label: 'User Roles', path: '/user-roles', icon: ShieldCheck },
    { label: 'Organizations', path: '/organizations', icon: Network },
    { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const location = useLocation();
    const { user } = useAuth();

    // Filter nav items based on user role
    // Super Admins don't have a tenantId (they manage all tenants)
    // Tenant Admins have a tenantId (they manage their own tenant)
    const isSuperAdmin = !user?.tenantId;
    const filteredNavItems = navItems.filter(item =>
        !item.superAdminOnly || isSuperAdmin
    );

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out shadow-lg",
                isOpen ? "w-64" : "w-20"
            )}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-gradient-to-r from-background to-secondary/30">
                    <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isOpen ? "w-full" : "w-10")}>
                        <div className="flex-shrink-0 p-1.5 rounded-lg bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <span className={cn("font-bold text-lg whitespace-nowrap transition-opacity", isOpen ? "opacity-100" : "opacity-0 hidden")}>
                            DoorAuth
                        </span>
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "p-1 rounded-md hover:bg-secondary hidden md:block text-muted-foreground transition-all",
                            !isOpen && "absolute -right-3 top-20 bg-card border shadow-sm rounded-full p-1"
                        )}
                    >
                        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={14} />}
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {filteredNavItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-primary-50/50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 font-medium shadow-sm ring-1 ring-primary-200 dark:ring-primary-800"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                    !isOpen && "justify-center px-2"
                                )}
                                title={!isOpen ? item.label : undefined}
                            >
                                <item.icon size={20} className={cn("flex-shrink-0", isActive && "text-primary-500")} />
                                <span className={cn("whitespace-nowrap transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>
                                    {item.label}
                                </span>

                                {isActive && isOpen && (
                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* User Profile Summary (Simplified) */}
                <div className="p-4 border-t border-border bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium shadow-md">
                            A
                        </div>
                        <div className={cn("flex-1 overflow-hidden transition-all duration-300", isOpen ? "opacity-100" : "opacity-0 w-0 hidden")}>
                            <p className="text-sm font-medium truncate">Admin User</p>
                            <p className="text-xs text-muted-foreground truncate">admin@doorauth.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
