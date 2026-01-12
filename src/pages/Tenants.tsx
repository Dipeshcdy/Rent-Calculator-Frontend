import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { User, Trash2 } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    roomName: string;
    deviceCount: number;
}

const Tenants = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const { data: rooms } = await api.get('/rooms');
            const allTenants = rooms.flatMap((r: any) => r.tenants.map((t: any) => ({ ...t, roomName: r.name, deviceCount: t.deviceCount })));
            setTenants(allTenants);
        } catch (error) {
            console.error("Failed to fetch tenants");
        }
    };

    const handleDeviceCountChange = async (tenantId: string, count: number) => {
        if (count < 0) return;

        // Optimistic update
        setTenants(prev => prev.map((t: Tenant) => t.id === tenantId ? { ...t, deviceCount: count } : t));

        try {
            await api.patch(`/rooms/tenants/${tenantId}`, { deviceCount: count });
        } catch (error) {
            console.error('Failed to update device count');
            fetchTenants(); // Revert on error
        }
    };

    const handleDeleteTenant = async (tenantId: string) => {
        if (!confirm('Are you sure you want to delete this tenant?')) return;
        try {
            await api.delete(`/rooms/tenants/${tenantId}`);
            fetchTenants();
        } catch (error) {
            console.error('Failed to delete tenant');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tenants</h2>
                <p className="text-gray-500 text-sm">Manage tenants and their devices</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tenants.map((tenant: Tenant) => (
                    <div key={tenant.id} className="card flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-lg">{tenant.name}</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Room: {tenant.roomName}</p>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <div className="text-sm font-medium text-gray-500">Number of Devices:</div>
                                <div className="flex items-center border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => handleDeviceCountChange(tenant.id, tenant.deviceCount - 1)}
                                        className="px-3 py-1 bg-gray-50 hover:bg-gray-100 border-r"
                                    >
                                        -
                                    </button>
                                    <span className="px-4 py-1 font-medium bg-white">{tenant.deviceCount}</span>
                                    <button
                                        onClick={() => handleDeviceCountChange(tenant.id, tenant.deviceCount + 1)}
                                        className="px-3 py-1 bg-gray-50 hover:bg-gray-100 border-l"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Tenant"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tenants;
