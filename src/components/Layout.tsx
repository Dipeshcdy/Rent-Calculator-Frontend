

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Home, Users, Settings, LogOut, Zap, Briefcase, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import clsx from 'clsx';

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Home, label: 'Rooms', path: '/rooms' },
        { icon: Users, label: 'Tenants', path: '/tenants' },
        { icon: History, label: 'Billing History', path: '/billing-history' },
        { icon: Zap, label: 'Readings', path: '/readings' },
        { icon: Briefcase, label: 'Work Logs', path: '/work-logs' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Home className="w-8 h-8" /> RentCalc
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Sidebar;
