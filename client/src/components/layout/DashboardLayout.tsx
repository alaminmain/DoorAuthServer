import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                    sidebarOpen ? "md:pl-64" : "md:pl-20"
                )}
            >
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <div className="mx-auto max-w-7xl animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
