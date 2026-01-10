import { useEffect, useState } from 'react';
import api from '../lib/axios.ts';
import { Plus, User, Wifi, Trash2, Zap, CreditCard } from 'lucide-react';
import { getCurrentBSDate, convertADToBS, formatBSDate, formatBSMonthYear } from '../lib/dateUtils';

interface Room {
    id: string;
    name: string;
    baseRent: number;
    nextBillingDate?: string;
    tenants: any[];
    readings?: any[];
    bills?: any[];
}

const Rooms = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', baseRent: '' });

    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [paymentType, setPaymentType] = useState('CASH');
    const [submittingPayment, setSubmittingPayment] = useState(false);

    // History State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [roomHistory, setRoomHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedRoomName, setSelectedRoomName] = useState('');

    // Tenant State
    const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
    const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantDueDay, setNewTenantDueDay] = useState(new Date().getDate().toString());
    const [isExistingTenant, setIsExistingTenant] = useState(false);
    const [editTenantForm, setEditTenantForm] = useState({ name: '', deviceCount: '', dueDay: '' });
    const [isEditBillModalOpen, setIsEditBillModalOpen] = useState(false);
    const [selectedBillToEdit, setSelectedBillToEdit] = useState<any>(null);
    const [editBillForm, setEditBillForm] = useState({
        rentAmount: '',
        internetAmount: '',
        electricityAmount: '',
        serviceCharge: '',
        arrears: ''
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/rooms');
            setRooms(data);
        } catch (error: any) {
            console.error('Failed to fetch rooms', error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch rooms';
            alert(msg);
            if (error.response?.status === 401) {
                // Token might be invalid, logout or redirect
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    };

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/rooms', newRoom);
            setIsModalOpen(false);
            setNewRoom({ name: '', baseRent: '' });
            fetchRooms();
        } catch (error: any) {
            console.error('Failed to add room', error);
            alert(error.response?.data?.error || 'Failed to add room');
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room? This will delete all tenants in it.')) return;
        try {
            await api.delete(`/rooms/${roomId}`);
            fetchRooms();
        } catch (error) {
            console.error('Failed to delete room');
        }
    };

    const openTenantModal = (roomId: string) => {
        setSelectedRoomId(roomId);
        setIsTenantModalOpen(true);
    };

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoomId) return;

        try {
            await api.post(`/rooms/${selectedRoomId}/tenants`, {
                name: newTenantName,
                dueDay: parseInt(newTenantDueDay),
                isExistingTenant: isExistingTenant
            });
            setIsTenantModalOpen(false);
            setNewTenantName('');
            setNewTenantDueDay(getCurrentBSDate().day.toString());
            setIsExistingTenant(false);
            setSelectedRoomId(null);
            fetchRooms();
        } catch (error) {
            console.error('Failed to add tenant', error);
        }
    };

    const openEditTenantModal = (tenant: any) => {
        setSelectedTenant(tenant);
        setEditTenantForm({
            name: tenant.name || '',
            deviceCount: (tenant.deviceCount ?? 0).toString(),
            dueDay: (tenant.dueDay ?? 1).toString()
        });
        setIsEditTenantModalOpen(true);
    };

    const handleEditTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;

        try {
            console.log('DEBUG: Sending PATCH for tenant:', selectedTenant.id, editTenantForm);
            await api.patch(`/rooms/tenants/${selectedTenant.id}`, {
                name: editTenantForm.name,
                deviceCount: parseInt(editTenantForm.deviceCount) || 0,
                dueDay: parseInt(editTenantForm.dueDay) || 1
            });
            alert('Tenant updated successfully!');
            setIsEditTenantModalOpen(false);
            setSelectedTenant(null);
            fetchRooms();
        } catch (error: any) {
            console.error('Failed to update tenant', error);
            alert('Failed to update tenant: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill || !paymentAmount) return;

        setSubmittingPayment(true);
        try {
            await api.patch(`/billing/pay/${selectedBill.id}`, {
                amount: paymentAmount,
                remarks: paymentRemarks,
                paymentType: paymentType
            });
            setIsPaymentModalOpen(false);
            setSelectedBill(null);
            setPaymentAmount('');
            setPaymentRemarks('');
            fetchRooms();
        } catch (error) {
            console.error('Failed to record payment', error);
        } finally {
            setSubmittingPayment(false);
        }
    };

    const openEditBillModal = (bill: any) => {
        setSelectedBillToEdit(bill);
        setEditBillForm({
            rentAmount: bill.rentAmount.toString(),
            internetAmount: bill.internetAmount.toString(),
            electricityAmount: bill.electricityAmount.toString(),
            serviceCharge: (bill.serviceCharge || 0).toString(),
            arrears: bill.arrears.toString()
        });
        setIsEditBillModalOpen(true);
    };

    const handleEditBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBillToEdit) return;

        try {
            const { data: updatedBill } = await api.patch(`/billing/bill/${selectedBillToEdit.id}`, {
                rentAmount: editBillForm.rentAmount,
                internetAmount: editBillForm.internetAmount,
                electricityAmount: editBillForm.electricityAmount,
                serviceCharge: editBillForm.serviceCharge,
                arrears: editBillForm.arrears
            });

            // Update local history state if open
            setRoomHistory(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
            setIsEditBillModalOpen(false);
            setSelectedBillToEdit(null);
            fetchRooms(); // Refresh main UI
            alert('Bill updated successfully!');
        } catch (error: any) {
            console.error('Failed to update bill', error);
            alert('Failed to update bill: ' + (error.response?.data?.error || error.message));
        }
    };

    const fetchRoomHistory = async (roomId: string, roomName: string) => {
        setLoadingHistory(true);
        setSelectedRoomName(roomName);
        setIsHistoryModalOpen(true);
        try {
            const { data } = await api.get(`/billing/room-history/${roomId}`);
            setRoomHistory(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const openPaymentModal = (bill: any) => {
        setSelectedBill(bill);
        setPaymentAmount((bill.totalAmount - bill.paidAmount).toString());
        setIsPaymentModalOpen(true);
    };

    const getNextDueDate = (dueDay: any) => {
        const { day, month, year } = getCurrentBSDate();
        let targetMonth = month;
        let targetYear = year;

        if (parseInt(dueDay) <= day) {
            targetMonth += 1;
            if (targetMonth > 12) {
                targetMonth = 1;
                targetYear += 1;
            }
        }

        return formatBSMonthYear(targetMonth, targetYear);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Rooms</h2>
                    <p className="text-gray-500">Manage rooms and tenants</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Room
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div key={room.id} className="card hover:shadow-md transition-shadow relative group">
                        <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex justify-between items-start mb-4 pr-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                                <div className="flex flex-col gap-1 mt-1">
                                    {room.nextBillingDate && (
                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                            Next Bill: {(() => {
                                                const bsDate = convertADToBS(new Date(room.nextBillingDate));
                                                return formatBSDate(bsDate.day, bsDate.month, bsDate.year);
                                            })()}
                                        </div>
                                    )}
                                    {room.readings && room.readings.length > 0 ? (
                                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold w-fit border border-amber-100">
                                            <Zap className="w-3 h-3" />
                                            <span>Last: {room.readings[0].units} units</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400 italic">No readings yet</div>
                                    )}
                                </div>
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold h-fit">
                                रु {room.baseRent}
                            </span>
                        </div>

                        {room.bills && room.bills.length > 0 && (
                            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Outstanding</div>
                                    <div className="text-lg font-bold text-red-700">रु {room.bills[0].totalAmount - room.bills[0].paidAmount}</div>
                                </div>
                                <button
                                    onClick={() => room.bills && openPaymentModal(room.bills[0])}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    <CreditCard className="w-3 h-3" /> Pay
                                </button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tenants</div>
                            {room.tenants.length === 0 ? (
                                <p className="text-gray-400 text-sm italic">No tenants assigned</p>
                            ) : (
                                room.tenants.map(tenant => (
                                    <div key={tenant.id} className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-bold text-gray-800">{tenant.name}</span>
                                            </div>
                                            <button
                                                onClick={() => openEditTenantModal(tenant)}
                                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-tighter"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border">
                                                <Wifi className="w-3 h-3" />
                                                {tenant.deviceCount} Devices
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border">
                                                <CreditCard className="w-3 h-3" />
                                                Due: Day {tenant.dueDay} ({getNextDueDate(tenant.dueDay)})
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            <button
                                onClick={() => openTenantModal(room.id)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                                Add Tenant
                            </button>
                            <button
                                onClick={() => fetchRoomHistory(room.id, room.name)}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium border-l pl-2"
                            >
                                Payment History
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pay Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-2 text-indigo-900 border-b pb-2">Record Payment</h3>

                        {selectedBill && (
                            <div className="mb-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2">Bill Summary</div>
                                <div className="space-y-1.5 text-xs text-indigo-900">
                                    <div className="flex justify-between">
                                        <span>Base Rent</span>
                                        <span className="font-bold">रु {selectedBill.rentAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Internet</span>
                                        <span className="font-bold">रु {selectedBill.internetAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Electricity</span>
                                        <span className="font-bold">रु {selectedBill.electricityAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Service Charge</span>
                                        <span className="font-bold">रु {selectedBill.serviceCharge || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Arrears</span>
                                        <span className="font-bold">रु {selectedBill.arrears}</span>
                                    </div>
                                    <div className="flex justify-between pt-1.5 border-t border-indigo-200/50 text-indigo-700 text-sm">
                                        <span className="font-bold">Total Bill</span>
                                        <span className="font-black">रु {selectedBill.totalAmount}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-gray-500 mb-4">Entering payment for current bill including arrears.</p>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Amount (रु)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={paymentAmount}
                                        onFocus={(e) => e.target.select()}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Method</label>
                                    <select
                                        className="input-field"
                                        value={paymentType}
                                        onChange={e => setPaymentType(e.target.value)}
                                    >
                                        <option value="CASH">Cash/Money</option>
                                        <option value="WORK">Service/Work</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Remarks / Work Description</label>
                                <textarea
                                    className="input-field min-h-[80px]"
                                    placeholder={paymentType === 'WORK' ? "Describe the work done (e.g. Fixed plumbing, Painted gate)" : "e.g. Paid for internet, Partial payment etc."}
                                    value={paymentRemarks}
                                    onChange={e => setPaymentRemarks(e.target.value)}
                                    required={paymentType === 'WORK'}
                                />
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={submittingPayment} className="btn-primary">
                                    {submittingPayment ? 'Saving...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Room Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New Room</h3>
                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Room Name</label>
                                <input
                                    className="input-field"
                                    value={newRoom.name}
                                    onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Base Rent</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={newRoom.baseRent}
                                    onChange={e => setNewRoom({ ...newRoom, baseRent: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="btn-primary">Create Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Tenant Modal */}
            {isTenantModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New Tenant</h3>
                        <form onSubmit={handleAddTenant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Tenant Name</label>
                                <input
                                    className="input-field"
                                    value={newTenantName}
                                    onChange={e => setNewTenantName(e.target.value)}
                                    placeholder="Enter full name"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Due Day (BS: 1-32)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="32"
                                    className="input-field"
                                    value={newTenantDueDay}
                                    onChange={e => setNewTenantDueDay(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isExistingTenant"
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={isExistingTenant}
                                    onChange={e => setIsExistingTenant(e.target.checked)}
                                />
                                <label htmlFor="isExistingTenant" className="text-sm font-medium text-gray-700 select-none">
                                    Existing Tenant (Generate bill for previous month)
                                </label>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTenantModalOpen(false);
                                        setNewTenantName('');
                                        setSelectedRoomId(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Add Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Tenant Modal */}
            {isEditTenantModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Edit Tenant</h3>
                        <form onSubmit={handleEditTenant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tenant Name</label>
                                <input
                                    className="input-field"
                                    value={editTenantForm.name}
                                    onChange={e => setEditTenantForm({ ...editTenantForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Device Count</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={editTenantForm.deviceCount}
                                        onChange={e => setEditTenantForm({ ...editTenantForm, deviceCount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Due Day (BS: 1-32)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="32"
                                        className="input-field"
                                        value={editTenantForm.dueDay}
                                        onChange={e => setEditTenantForm({ ...editTenantForm, dueDay: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditTenantModalOpen(false);
                                        setSelectedTenant(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Payment History - {selectedRoomName}</h3>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : roomHistory.length === 0 ? (
                            <div className="flex-1 text-center py-12 text-gray-500 italic">
                                No billing records found.
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2">
                                <div className="space-y-6">
                                    {roomHistory.map((bill: any) => (
                                        <div key={bill.id} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">
                                                        {formatBSMonthYear(bill.month, bill.year)}
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] text-gray-500 font-medium">
                                                        <div className="flex justify-between border-b border-gray-100 pb-0.5">
                                                            <span>Base Rent:</span>
                                                            <span className="text-gray-700 font-bold">रु {bill.rentAmount}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 pb-0.5">
                                                            <span>Internet:</span>
                                                            <span className="text-gray-700 font-bold">रु {bill.internetAmount}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 pb-0.5">
                                                            <span>Electricity:</span>
                                                            <span className="text-gray-700 font-bold">रु {bill.electricityAmount}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 pb-0.5">
                                                            <span>Service Charge:</span>
                                                            <span className="text-gray-700 font-bold">रु {bill.serviceCharge}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 pb-0.5">
                                                            <span>Arrears:</span>
                                                            <span className="text-gray-700 font-bold">रु {bill.arrears}</span>
                                                        </div>
                                                        <div className="flex justify-between text-indigo-600 pt-0.5">
                                                            <span className="font-bold">Total:</span>
                                                            <span className="font-bold">रु {bill.totalAmount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${bill.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {bill.isPaid ? 'Fully Paid' : `Pending: रु ${bill.totalAmount - bill.paidAmount}`}
                                                    </span>
                                                    <button
                                                        onClick={() => openEditBillModal(bill)}
                                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase"
                                                    >
                                                        Edit Bill
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Logs</div>
                                                {bill.paymentLogs && bill.paymentLogs.length > 0 ? (
                                                    <div className="divide-y divide-gray-200">
                                                        {bill.paymentLogs.map((log: any) => (
                                                            <div key={log.id} className="py-2 flex justify-between items-start">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-sm font-medium text-gray-800">रु {log.amount}</div>
                                                                        {log.paymentType === 'WORK' && (
                                                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase border border-amber-200">Work</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{log.remarks || <span className="italic">No remarks</span>}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[10px] text-gray-400">
                                                                        {(() => {
                                                                            const bsDate = convertADToBS(new Date(log.createdAt));
                                                                            return `${formatBSDate(bsDate.day, bsDate.month, bsDate.year)} ${new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">No payments recorded for this bill.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t">
                            <button onClick={() => setIsHistoryModalOpen(false)} className="w-full btn-primary bg-gray-100 hover:bg-gray-200 text-gray-900 border-none">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Bill Modal */}
            {isEditBillModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Edit Bill Components</h3>
                        <form onSubmit={handleEditBill} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Base Rent</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={editBillForm.rentAmount}
                                    onChange={e => setEditBillForm({ ...editBillForm, rentAmount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Internet</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={editBillForm.internetAmount}
                                        onChange={e => setEditBillForm({ ...editBillForm, internetAmount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Electricity</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={editBillForm.electricityAmount}
                                        onChange={e => setEditBillForm({ ...editBillForm, electricityAmount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Service Charge</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={editBillForm.serviceCharge}
                                        onChange={e => setEditBillForm({ ...editBillForm, serviceCharge: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Arrears</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={editBillForm.arrears}
                                        onChange={e => setEditBillForm({ ...editBillForm, arrears: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t bg-gray-50 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-bold text-gray-500">New Total:</span>
                                    <span className="text-lg font-black text-indigo-600">
                                        रु {(
                                            parseFloat(editBillForm.rentAmount || '0') +
                                            parseFloat(editBillForm.internetAmount || '0') +
                                            parseFloat(editBillForm.electricityAmount || '0') +
                                            parseFloat(editBillForm.serviceCharge || '0') +
                                            parseFloat(editBillForm.arrears || '0')
                                        ).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditBillModalOpen(false)}
                                        className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
