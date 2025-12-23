import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LogOut, Sun, Moon, Bell, Search, Menu } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
    toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-30 h-16 w-full bg-background/80 backdrop-blur-md border-b border-border transition-all">
            <div className="h-full flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 rounded-md hover:bg-secondary md:hidden text-muted-foreground"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Global Search */}
                    <div className="relative hidden md:flex items-center w-64 lg:w-96">
                        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full h-9 pl-9 pr-4 rounded-full border border-input bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 hover:bg-secondary transition-all text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Notifications */}
                    <button className="p-2 rounded-full hover:bg-secondary text-muted-foreground relative transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-all hover:rotate-12"
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="h-6 w-px bg-border mx-1"></div>

                    {/* User User & Logout */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium leading-none">{user?.userName || 'User'}</p>
                            <p className="text-xs text-muted-foreground mt-1">{user?.companyName || 'DoorAuth'}</p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
