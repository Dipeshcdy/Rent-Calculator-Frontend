import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { getCurrentBSDate, getNepaliMonthName, getBSYearOptions, formatBSMonthYear } from '../lib/dateUtils';

interface Reading {
    id: string;
    units: number;
    month: number;
    year: number;
    roomId: string;
}

interface RoomReadingStatus {
    id: string;
    name: string;
    reading?: Reading;
    previousReading?: Reading;
}

interface CompletedRoom extends RoomReadingStatus {
    reading: Reading;
}

const Readings = () => {
    const [rooms, setRooms] = useState<RoomReadingStatus[]>([]);
    const [readings, setReadings] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const currentBS = getCurrentBSDate();
    const [month, setMonth] = useState(currentBS.month);
    const [year, setYear] = useState(currentBS.year);

    useEffect(() => {
        fetchReadings();
    }, [month, year]);

    const [isGenerating, setIsGenerating] = useState(false);

    const fetchReadings = async () => {
        try {
            // Use BS month/year directly
            const { data } = await api.get(`/billing/readings-status/${month}/${year}`);
            setRooms(data);
        } catch (error) {
            console.error('Failed to fetch readings', error);
        }
    };

    const handleReadingChange = (roomId: string, value: string) => {
        setReadings(prev => ({ ...prev, [roomId]: value }));
    };

    const submitReading = async (roomId: string) => {
        setSubmitting(prev => ({ ...prev, [roomId]: true }));
        try {
            // Use BS month/year directly
            const { data: newReading } = await api.post('/billing/readings', {
                roomId,
                units: parseFloat(readings[roomId]),
                month: month,
                year: year
            });

            setMessage({ type: 'success', text: 'Reading recorded successfully!' });

            setRooms(prev => prev.map((r: RoomReadingStatus) => {
                if (r.id === roomId) {
                    return { ...r, reading: newReading };
                }
                return r;
            }));

            setReadings(prev => {
                const copy = { ...prev };
                delete copy[roomId];
                return copy;
            });

        } catch (error) {
            console.error('Failed to submit reading', error);
            setMessage({ type: 'error', text: 'Failed to submit reading.' });
        } finally {
            setSubmitting(prev => ({ ...prev, [roomId]: false }));
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const pendingRooms = rooms.filter(r => !r.reading);
    const completedRooms = rooms.filter((r): r is CompletedRoom => !!r.reading);

    const [editingReadingId, setEditingReadingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleEditStart = (readingOrRoomId: Reading | string, isNew: boolean = false) => {
        if (isNew) {
            setEditingReadingId(`new-prev-${readingOrRoomId}`);
            setEditValue('0');
        } else {
            const reading = readingOrRoomId as Reading;
            setEditingReadingId(reading.id);
            setEditValue(reading.units.toString());
        }
    };

    const handleEditSave = async (readingIdOrNew: string) => {
        try {
            let updatedReading: any;
            if (readingIdOrNew.startsWith('new-prev-')) {
                const roomId = readingIdOrNew.replace('new-prev-', '');
                const prevMonth = month === 1 ? 12 : month - 1;
                const prevYear = month === 1 ? year - 1 : year;

                // Use BS prev month/year directly
                const { data } = await api.post('/billing/readings', {
                    roomId,
                    units: parseFloat(editValue),
                    month: prevMonth,
                    year: prevYear
                });
                updatedReading = data;

                setRooms((prev: RoomReadingStatus[]) => prev.map((room: RoomReadingStatus) => {
                    if (room.id === roomId) {
                        return { ...room, previousReading: updatedReading };
                    }
                    return room;
                }));
            } else {
                const { data } = await api.patch(`/billing/readings/${readingIdOrNew}`, {
                    units: parseFloat(editValue)
                });
                updatedReading = data;

                setRooms((prev: RoomReadingStatus[]) => prev.map((room: RoomReadingStatus) => {
                    if (room.reading && room.reading.id === readingIdOrNew) {
                        return { ...room, reading: updatedReading };
                    }
                    if (room.previousReading && room.previousReading.id === readingIdOrNew) {
                        return { ...room, previousReading: updatedReading };
                    }
                    return room;
                }));
            }
            setEditingReadingId(null);
            setMessage({ type: 'success', text: 'Reading updated successfully!' });
        } catch (error) {
            console.error('Failed to update reading', error);
            setMessage({ type: 'error', text: 'Failed to update reading.' });
        } finally {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleGenerateBills = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setIsGenerating(true);
        try {
            await api.post(`/billing/generate/${month}/${year}`);
            setMessage({ type: 'success', text: 'Bills generated successfully! Revenue stats updated.' });
            fetchReadings(); // Re-fetch to show updated isBilled status or any changes
        } catch (error: any) {
            console.error('Failed to generate bills', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to generate bills.' });
        } finally {
            setIsGenerating(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Record Readings</h2>
                    <p className="text-gray-500 text-sm">Electricity meter readings for {formatBSMonthYear(month, year)}</p>
                </div>
                {pendingRooms.length === 0 && rooms.length > 0 && (
                    <button
                        type="button"
                        onClick={handleGenerateBills}
                        disabled={isGenerating}
                        className="w-full sm:w-auto btn-primary bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        {isGenerating ? 'Generating...' : 'Generate Monthly Bills'}
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Select Period:</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        className="input-field flex-1 sm:max-w-[150px]"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {getNepaliMonthName(i + 1)}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input-field flex-1 sm:max-w-[120px]"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                        {getBSYearOptions().map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Readings */}
                <div className="card h-fit">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Pending Readings
                    </h3>
                    {pendingRooms.length === 0 ? (
                        <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                            <p className="text-sm">All pending readings completed!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {pendingRooms.map((room: RoomReadingStatus) => (
                                <div key={room.id} className="py-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <h4 className="font-medium text-gray-900">{room.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="text-[11px] text-gray-700 font-bold bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                {editingReadingId === (room.previousReading?.id || `new-prev-${room.id}`) ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={editValue}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                                            className="w-16 bg-white border rounded text-[11px] px-1 font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleEditSave(editingReadingId!)} className="text-green-600 font-bold hover:bg-green-50 p-0.5 rounded" title="Save">✓</button>
                                                        <button onClick={() => setEditingReadingId(null)} className="text-red-500 font-bold hover:bg-red-50 p-0.5 rounded" title="Cancel">×</button>
                                                    </div>
                                                ) : (
                                                    <>PREV: {room.previousReading?.units || 0}</>
                                                )}
                                            </div>
                                            {editingReadingId !== (room.previousReading?.id || `new-prev-${room.id}`) && (
                                                <button
                                                    onClick={() => handleEditStart(room.previousReading || room.id, !room.previousReading)}
                                                    className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold uppercase border border-indigo-100 px-2 py-0.5 rounded bg-indigo-50"
                                                >
                                                    {room.previousReading ? 'Edit Prev' : 'Set Prev'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                className="input-field pl-9 w-full"
                                                placeholder="Enter Current Units"
                                                value={readings[room.id] || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleReadingChange(room.id, e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => submitReading(room.id)}
                                            disabled={!readings[room.id] || submitting[room.id]}
                                            className="btn-primary py-2 px-4 disabled:opacity-50"
                                        >
                                            {submitting[room.id] ? '...' : 'Save'}
                                        </button>
                                    </div>
                                    {readings[room.id] && room.previousReading && (
                                        <div className="mt-1 text-[10px] text-indigo-600 font-bold">
                                            Usage: {Math.max(0, parseFloat(readings[room.id]) - room.previousReading.units).toFixed(2)} units
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Readings */}
                <div className="card h-fit">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Completed Readings
                    </h3>
                    {completedRooms.length === 0 ? (
                        <p className="text-gray-400 italic text-center py-8">No readings recorded yet.</p>
                    ) : (
                        <div>
                            {/* Mobile View: Cards */}
                            <div className="md:hidden space-y-4">
                                {completedRooms.map((room: CompletedRoom) => (
                                    <div key={room.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-gray-900">{room.name}</span>
                                            <span className="text-indigo-600 font-black font-mono">
                                                {(room.reading.units - (room.previousReading?.units || 0)).toFixed(2)}
                                                <span className="text-[10px] ml-1 uppercase">Units</span>
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <span className="text-[10px] text-gray-500 uppercase block">Previous</span>
                                                <div className="font-mono text-gray-700">
                                                    {editingReadingId === (room.previousReading?.id || `new-prev-${room.id}`) ? (
                                                        <input
                                                            type="number"
                                                            value={editValue}
                                                            autoFocus
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                                            className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />
                                                    ) : (
                                                        room.previousReading?.units || 0
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-500 uppercase block">Current</span>
                                                <div className="font-mono font-bold text-gray-900">
                                                    {editingReadingId === room.reading.id ? (
                                                        <input
                                                            type="number"
                                                            value={editValue}
                                                            autoFocus
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                                            className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />
                                                    ) : (
                                                        room.reading.units
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                            {(editingReadingId === room.reading.id || editingReadingId === (room.previousReading?.id || `new-prev-${room.id}`)) ? (
                                                <div className="flex gap-2 w-full">
                                                    <button
                                                        onClick={() => handleEditSave(editingReadingId!)}
                                                        className="flex-1 text-green-600 font-bold hover:bg-green-100 py-2 rounded border border-green-200 bg-white"
                                                    >
                                                        SAVE
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingReadingId(null)}
                                                        className="flex-1 text-red-500 font-bold hover:bg-red-100 py-2 rounded border border-red-200 bg-white"
                                                    >
                                                        CANCEL
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEditStart(room.reading!)}
                                                        className="flex-1 text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase border border-indigo-200 px-3 py-2 rounded bg-white whitespace-nowrap"
                                                    >
                                                        Edit Current
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditStart(room.previousReading || room.id, !room.previousReading)}
                                                        className="flex-1 text-gray-500 hover:text-gray-700 font-bold text-[10px] uppercase border border-gray-200 px-3 py-2 rounded bg-white whitespace-nowrap"
                                                    >
                                                        {room.previousReading ? 'Edit Previous' : 'Set Previous'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-100">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium whitespace-nowrap">
                                        <tr>
                                            <th className="px-4 py-3">Room</th>
                                            <th className="px-4 py-3 text-right">Prev</th>
                                            <th className="px-4 py-3 text-right">Current</th>
                                            <th className="px-4 py-3 text-right">Usage</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {completedRooms.map((room: CompletedRoom) => (
                                            <tr key={room.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{room.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-500 font-mono">
                                                    {editingReadingId === (room.previousReading?.id || `new-prev-${room.id}`) ? (
                                                        <input
                                                            type="number"
                                                            value={editValue}
                                                            autoFocus
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                                            className="w-20 px-2 py-1 border rounded text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />
                                                    ) : (
                                                        <span>{room.previousReading?.units || 0}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900 font-mono">
                                                    {editingReadingId === room.reading.id ? (
                                                        <input
                                                            type="number"
                                                            value={editValue}
                                                            autoFocus
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                                            className="w-20 px-2 py-1 border rounded text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />
                                                    ) : (
                                                        room.reading.units
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-indigo-600 font-black font-mono">
                                                    {(room.reading.units - (room.previousReading?.units || 0)).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {(editingReadingId === room.reading.id || editingReadingId === (room.previousReading?.id || `new-prev-${room.id}`)) ? (
                                                        <div className="flex justify-end gap-2 text-xs">
                                                            <button
                                                                onClick={() => handleEditSave(editingReadingId!)}
                                                                className="text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded border border-green-100"
                                                            >
                                                                SAVE
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingReadingId(null)}
                                                                className="text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded border border-red-100"
                                                            >
                                                                CANCEL
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <button
                                                                onClick={() => handleEditStart(room.reading)}
                                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase border border-indigo-200 px-2 py-1 rounded bg-indigo-50 whitespace-nowrap"
                                                            >
                                                                Edit Current
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditStart(room.previousReading || room.id, !room.previousReading)}
                                                                className="text-gray-500 hover:text-gray-700 font-bold text-[10px] uppercase border border-gray-200 px-2 py-1 rounded bg-gray-50 whitespace-nowrap"
                                                            >
                                                                {room.previousReading ? 'Edit Previous' : 'Set Previous'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Readings;
