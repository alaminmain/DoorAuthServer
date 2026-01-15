import { useState, useEffect, type ElementType } from 'react';
import { dashboardService } from '../services/dashboard.service';
import {
    Users,
    Building2,
    AppWindow,
    ShieldCheck,
    Activity,
    ArrowUpRight,
    Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { cn } from '../utils/helpers';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    icon: ElementType;
    trend: 'up' | 'down' | 'neutral';
    color: string;
}

const StatCard = ({ title, value, change, icon: Icon, trend, color }: StatCardProps) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: color }}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                    <div className={cn("p-3 rounded-full bg-opacity-10")} style={{ backgroundColor: `${color}15`, color: color }}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                    </div>
                </div>
                <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full",
                    trend === 'up' ? "text-green-600 bg-green-100 dark:bg-green-900/20" :
                        trend === 'down' ? "text-red-600 bg-red-100 dark:bg-red-900/20" : "text-gray-600 bg-gray-100")}>
                    {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                    {change}
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null); // using any for mapped stats or interface
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getStats();

                // Map API data to UI format
                const uiStats = [
                    {
                        title: 'Total Tenants',
                        value: data.totalTenants.toString(),
                        change: 'Active',
                        icon: Building2,
                        trend: 'up',
                        color: '#3b82f6'
                    },
                    {
                        title: 'Active Applications',
                        value: data.totalApplications.toString(),
                        change: 'Integrated',
                        icon: AppWindow,
                        trend: 'up',
                        color: '#8b5cf6'
                    },
                    {
                        title: 'Registered Users',
                        value: data.totalUsers.toString(),
                        change: 'Total',
                        icon: Users,
                        trend: 'up',
                        color: '#10b981'
                    },
                    {
                        title: 'System Roles',
                        value: data.totalRoles.toString(),
                        change: 'defined',
                        icon: ShieldCheck,
                        trend: 'neutral',
                        color: '#f59e0b'
                    },
                ];

                setStats(uiStats);
                setActivity(data.recentActivity);
            } catch (error: any) {
                // Don't log error if it's a session expiration (redirect is happening)
                if (error?.message !== 'Session expired, please login again') {
                    console.error('Failed to load dashboard stats', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-secondary rounded mb-6"></div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-secondary rounded-lg"></div>
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-4 h-64 bg-secondary rounded-lg"></div>
                    <div className="col-span-3 h-64 bg-secondary rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your authentication system.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="flex items-center text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Healthy
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats && stats.map((stat: any, i: number) => (
                    <div key={stat.title} className="animate-slide-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <StatCard {...stat} trend={stat.trend as any} />
                    </div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Authentication Traffic</CardTitle>
                        <CardDescription>
                            Login attempts over the last 24 hours
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-secondary/20 rounded-md border border-dashed border-secondary m-4">
                            <Activity className="mr-2 h-4 w-4" /> Chart Visualization Placeholder
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest system events and audit logs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activity.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                            ) : (
                                activity.map((log) => (
                                    <div key={log.id} className="flex items-start pb-4 border-b border-border last:border-0 last:pb-0">
                                        <div className="rounded-full p-2 bg-secondary mr-4">
                                            <Clock className="h-4 w-4 text-primary-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {log.action} <span className="text-xs text-muted-foreground">({log.resource})</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {log.userName} {log.details ? `- ${log.details}` : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground opacity-70">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
