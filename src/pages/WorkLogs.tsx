import { useEffect, useState } from 'react';
import api from '../lib/axios';
import clsx from 'clsx';
import { Briefcase, Calendar, Home, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getCurrentBSDate, getNepaliMonthName, getBSYearOptions, formatBSMonthYear, formatBSDate, convertADToBS } from '../lib/dateUtils';

const WorkLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const currentBS = getCurrentBSDate();
    const [filterMonth, setFilterMonth] = useState(currentBS.month);
    const [filterYear, setFilterYear] = useState(currentBS.year);
    const [filterRoomId, setFilterRoomId] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [activeBill, setActiveBill] = useState<any>(null);
    const [workAmount, setWorkAmount] = useState('');
    const [workDescription, setWorkDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchWorkLogs();
        fetchRooms();
    }, [filterMonth, filterYear, filterRoomId]);

    const fetchWorkLogs = async () => {
        try {
            const { data } = await api.get('/billing/work-logs', {
                params: {
                    month: filterMonth,
                    year: filterYear,
                    roomId: filterRoomId || undefined
                }
            });
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch work logs', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/rooms');
            setRooms(data);
        } catch (error) {
            console.error('Failed to fetch rooms', error);
        }
    };

    const handleRoomChange = async (roomId: string) => {
        setSelectedRoomId(roomId);
        setActiveBill(null);
        if (!roomId) return;

        try {
            const { data } = await api.get(`/billing/active-bill/${roomId}`);
            setActiveBill(data);
        } catch (error) {
            console.error('Failed to fetch active bill', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBill) {
            setMessage({ type: 'error', text: 'No active unpaid bill found for this room.' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            await api.patch(`/billing/pay/${activeBill.id}`, {
                amount: workAmount,
                remarks: workDescription,
                paymentType: 'WORK'
            });

            setMessage({ type: 'success', text: 'Work logged and bill updated successfully!' });

            // Reset form
            setWorkAmount('');
            setWorkDescription('');
            setSelectedRoomId('');
            setActiveBill(null);

            // Refresh logs
            fetchWorkLogs();

            // Close modal after delay
            setTimeout(() => {
                setIsModalOpen(false);
                setMessage(null);
            }, 2000);

        } catch (error: any) {
            console.error('Failed to log work', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to log work' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Work Logs</h2>
                    <p className="text-gray-500">History of services and work done by tenants as payment</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Log Work
                </button>
            </div>

            <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm items-center">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Filter:</span>
                <select
                    className="input-field max-w-[150px]"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {getNepaliMonthName(i + 1)}
                        </option>
                    ))}
                </select>
                <select
                    className="input-field max-w-[120px]"
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                >
                    {getBSYearOptions().map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <select
                    className="input-field max-w-[150px]"
                    value={filterRoomId}
                    onChange={(e) => setFilterRoomId(e.target.value)}
                >
                    <option value="">All Rooms</option>
                    {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                </select>
            </div>

            {logs.length === 0 ? (
                <div className="card text-center py-12 text-gray-500 italic">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    No work logs found.
                </div>
            ) : (
                <div className="grid gap-4">
                    {logs.map((log) => (
                        <div key={log.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-100 p-3 rounded-xl">
                                        <Briefcase className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {log.remarks || 'General Service Work'}
                                        </h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                <Home className="w-4 h-4" />
                                                {log.bill.room.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                {(() => {
                                                    const bsDate = convertADToBS(new Date(log.createdAt));
                                                    return formatBSDate(bsDate.day, bsDate.month, bsDate.year);
                                                })()}
                                            </div>
                                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider py-0.5">
                                                For {formatBSMonthYear(log.bill.month, log.bill.year)} Bill
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100 self-start md:self-center">
                                    <span className="text-sm font-bold text-green-600 uppercase">Valued at</span>
                                    <span className="text-xl font-black text-green-700 flex items-center">
                                        रु {log.amount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Log Work Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                <h3 className="text-xl font-bold">Log New Work Log</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {message && (
                                <div className={clsx(
                                    "p-4 rounded-xl flex items-center gap-3",
                                    message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                )}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <span className="text-sm font-medium">{message.text}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700">Select Room</label>
                                <select
                                    className="input-field"
                                    value={selectedRoomId}
                                    onChange={(e) => handleRoomChange(e.target.value)}
                                    required
                                >
                                    <option value="">Choose a room...</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedRoomId && (
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                    {activeBill ? (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Bill Found</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {formatBSMonthYear(activeBill.month, activeBill.year)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Balance Due</p>
                                                <p className="text-sm font-black text-indigo-600">रु {activeBill.totalAmount - activeBill.paidAmount}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-amber-600 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            No unpaid bills found for this room.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700">Amount (रु)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="Value of the work done"
                                    value={workAmount}
                                    onChange={e => setWorkAmount(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700">Work Description</label>
                                <textarea
                                    className="input-field min-h-[100px]"
                                    placeholder="e.g. Fixed plumbing, Painted gate, Cleaned yard..."
                                    value={workDescription}
                                    onChange={e => setWorkDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !activeBill}
                                    className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Register Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkLogs;
