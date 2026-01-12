
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Home, Users, Settings, LogOut, Zap, Briefcase, History, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems: NavItem[] = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Home, label: 'Rooms', path: '/rooms' },
        { icon: Users, label: 'Tenants', path: '/tenants' },
        { icon: History, label: 'Billing History', path: '/billing-history' },
        { icon: Zap, label: 'Readings', path: '/readings' },
        { icon: Briefcase, label: 'Work Logs', path: '/work-logs' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Home className="w-6 h-6" /> RentCalc
                </h1>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col shrink-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 hidden md:block">
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Home className="w-8 h-8" /> RentCalc
                    </h1>
                </div>

                {/* Mobile Sidebar Header */}
                <div className="p-6 md:hidden border-b border-gray-100 mb-2">
                    <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                        <Home className="w-6 h-6" /> RentCalc
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item: NavItem) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
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

            <main className="flex-1 overflow-auto p-4 md:p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Sidebar;
