import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios.ts';
import { Home, Users, Zap, DollarSign, AlertCircle } from 'lucide-react';
import { getCurrentBSDate } from '../lib/dateUtils';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="card flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRooms: 0,
        totalTenants: 0,
        pendingBills: 0,
        overdueAutomation: 0,
        revenue: 0,
        totalArrears: 0
    });

    const [pendingReadingsCount, setPendingReadingsCount] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchStats();
        checkPendingReadings();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/dashboard/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const checkPendingReadings = async () => {
        const { day, month, year } = getCurrentBSDate();
        // Only show notification if it's after the 20th of the month
        if (day <= 20) return;

        try {
            const { data } = await api.get(`/billing/pending-readings/${month}/${year}`);
            setPendingReadingsCount(data.length);
        } catch (error) {
            console.error('Failed to check pending readings');
        }
    };

    return (
        <div className="space-y-6">
            {(pendingReadingsCount > 0 || stats.overdueAutomation > 0) && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <Zap className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800">Action Required: Record Electricity Readings</h3>
                            <p className="text-sm text-amber-700">
                                {stats.overdueAutomation > 0
                                    ? `${stats.overdueAutomation} rooms are OVERDUE for billing and need readings.`
                                    : `You have ${pendingReadingsCount} rooms pending for this month's electricity reading.`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/readings')}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                    >
                        Record Now
                    </button>
                </div>
            )}

            <div>
                <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-500 mt-1">Overview of your rental properties</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Home} label="Total Rooms" value={stats.totalRooms} color="bg-blue-500" />
                <StatCard icon={Users} label="Active Tenants" value={stats.totalTenants} color="bg-emerald-500" />
                <StatCard icon={DollarSign} label="Monthly Collection" value={`रु ${stats.revenue}`} color="bg-indigo-500" />
                <StatCard icon={AlertCircle} label="Total Arrears" value={`रु ${stats.totalArrears}`} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Recent Activity</h3>
                    <div className="text-gray-400 text-center py-8">
                        No recent activity
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => navigate('/rooms')} className="btn-primary">Add Room</button>
                        <button onClick={() => navigate('/readings')} className="btn-primary bg-emerald-600 hover:bg-emerald-700">Record Reading</button>
                        <button
                            type="button"
                            disabled={isGenerating}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const { month, year } = getCurrentBSDate();

                                setIsGenerating(true);
                                api.post(`/billing/generate/${month}/${year}`).then(() => {
                                    alert('Bills generated successfully!');
                                    fetchStats();
                                }).catch(err => {
                                    alert(err.response?.data?.error || 'Failed to generate bills');
                                }).finally(() => {
                                    setIsGenerating(false);
                                });
                            }}
                            className="btn-primary bg-indigo-600 hover:bg-indigo-700 col-span-2"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Monthly Bills'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
