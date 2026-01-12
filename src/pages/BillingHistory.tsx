import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Calendar, FileText, CheckCircle2, XCircle, Info, Briefcase, IndianRupee, X } from 'lucide-react';
import clsx from 'clsx';
import { getCurrentBSDate, getNepaliMonthName, getBSYearOptions, convertADToBS, formatBSDate, formatBSMonthYear } from '../lib/dateUtils';

interface Tenant {
    id: string;
    name: string;
}

interface Room {
    id: string;
    name: string;
    tenants: Tenant[];
}

interface PaymentLog {
    id: string;
    amount: number;
    paymentType: 'CASH' | 'WORK';
    remarks: string;
    createdAt: string;
}

interface Bill {
    id: string;
    roomId: string;
    month: number;
    year: number;
    totalAmount: number;
    paidAmount: number;
    isPaid: boolean;
    rentAmount: number;
    electricityAmount: number;
    waterAmount: number;
    wasteAmount: number;
    internetAmount: number;
    serviceCharge: number;
    arrears: number;
    room: Room;
    paymentLogs: PaymentLog[];
}

const BillingHistory = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const currentBS = getCurrentBSDate();
    const [month, setMonth] = useState(currentBS.month);
    const [year, setYear] = useState(currentBS.year);

    // Details Modal State
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    useEffect(() => {
        fetchBills();
    }, [month, year]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            // Use BS month/year directly
            const { data } = await api.get('/billing/all-bills', {
                params: { month: month, year: year }
            });
            setBills(data);
        } catch (error) {
            console.error('Failed to fetch bills', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (bill: Bill) => {
        setSelectedBill(bill);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Billing History</h2>
                    <p className="text-gray-500 text-sm">View and manage all room bills for a specific period</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
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

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : bills.length === 0 ? (
                <div className="card text-center py-12 text-gray-500 italic">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    No bills generated for this period.
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Mobile View: Cards */}
                    <div className="md:hidden space-y-4">
                        {bills.map((bill: Bill) => {
                            const balance = bill.totalAmount - bill.paidAmount;
                            const isPaid = bill.isPaid;

                            return (
                                <div key={bill.id} className="card p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{bill.room.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {bill.room.tenants.map((t: Tenant) => t.name).join(', ') || <span className="italic">Empty</span>}
                                            </p>
                                        </div>
                                        <span className={clsx(
                                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            isPaid
                                                ? "bg-green-50 text-green-700 border-green-100"
                                                : balance === bill.totalAmount
                                                    ? "bg-red-50 text-red-700 border-red-100"
                                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                        )}>
                                            {isPaid ? 'Paid' : balance === bill.totalAmount ? 'Unpaid' : 'Partial'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
                                        <div>
                                            <span className="text-[10px] text-gray-400 uppercase block">Total</span>
                                            <span className="text-sm font-bold text-gray-900">रु {bill.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-400 uppercase block">Paid</span>
                                            <span className="text-sm font-bold text-green-600">रु {bill.paidAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-400 uppercase block">Balance</span>
                                            <span className="text-sm font-black text-indigo-600">रु {balance.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleViewDetails(bill)}
                                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors border border-indigo-100"
                                    >
                                        View Details
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Room</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Total Bill</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Paid</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Balance</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bills.map((bill: Bill) => {
                                        const balance = bill.totalAmount - bill.paidAmount;
                                        const isPaid = bill.isPaid;

                                        return (
                                            <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{bill.room.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {bill.room.tenants.map((t: Tenant) => t.name).join(', ') || <span className="italic text-gray-400">Empty</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-900">रु {bill.totalAmount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">रु {bill.paidAmount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-black text-indigo-600">रु {balance.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={clsx(
                                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                                        isPaid
                                                            ? "bg-green-50 text-green-700 border-green-100"
                                                            : balance === bill.totalAmount
                                                                ? "bg-red-50 text-red-700 border-red-100"
                                                                : "bg-amber-50 text-amber-700 border-amber-100"
                                                    )}>
                                                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : balance === bill.totalAmount ? <XCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                                                        {isPaid ? 'Paid' : balance === bill.totalAmount ? 'Unpaid' : 'Partial'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleViewDetails(bill)}
                                                        className="text-indigo-600 hover:text-indigo-900 font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Bill Details Modal */}
            {isDetailsModalOpen && selectedBill && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    <h3 className="text-xl font-bold">Billing Details</h3>
                                </div>
                                <p className="text-indigo-100 text-xs mt-0.5 uppercase tracking-widest font-bold">
                                    {selectedBill.room.name} • {formatBSMonthYear(selectedBill.month, selectedBill.year)}
                                </p>
                            </div>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                                {/* Component Breakdown */}
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Bill Breakdown</h4>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                        {(
                                            [
                                                { label: 'Rent', value: selectedBill.rentAmount },
                                                { label: 'Electricity', value: selectedBill.electricityAmount },
                                                { label: 'Water', value: selectedBill.waterAmount },
                                                { label: 'Waste', value: selectedBill.wasteAmount },
                                                { label: 'Internet', value: selectedBill.internetAmount },
                                                { label: 'Service Charge', value: selectedBill.serviceCharge },
                                                { label: 'Arrears', value: selectedBill.arrears }
                                            ] as { label: string; value: number | undefined }[]
                                        ).filter(item => item.value !== undefined && item.value !== null).map(item => (
                                            <div key={item.label} className="p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                <p className="text-sm sm:text-lg font-black text-gray-900 mt-0.5">रु {(item.value || 0).toLocaleString()}</p>
                                            </div>
                                        ))}
                                        <div className="p-2 sm:p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <p className="text-[8px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Grand Total</p>
                                            <p className="text-sm sm:text-lg font-black text-indigo-700 mt-0.5">रु {selectedBill.totalAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History */}
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Payment History</h4>
                                    {!selectedBill.paymentLogs || selectedBill.paymentLogs.length === 0 ? (
                                        <div className="p-6 sm:p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 italic text-sm">
                                            No payments recorded for this bill.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedBill.paymentLogs.map((log: PaymentLog) => (
                                                <div key={log.id} className="p-3 sm:p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center group hover:border-indigo-200 transition-colors gap-3">
                                                    <div className="flex items-center gap-3 sm:gap-4">
                                                        <div className={clsx(
                                                            "p-2 sm:p-2.5 rounded-lg",
                                                            log.paymentType === 'WORK' ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                                                        )}>
                                                            {log.paymentType === 'WORK' ? <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" /> : <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-gray-900 text-sm sm:text-base">रु {log.amount.toLocaleString()}</span>
                                                                {log.paymentType === 'WORK' && (
                                                                    <span className="text-[8px] sm:text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 uppercase">Work Log</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{log.remarks || 'Standard Payment'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right border-t sm:border-0 pt-2 sm:pt-0">
                                                        <div className="text-[10px] sm:text-xs text-gray-500">
                                                            {(() => {
                                                                const bsDate = convertADToBS(new Date(log.createdAt));
                                                                return formatBSDate(bsDate.day, bsDate.month, bsDate.year);
                                                            })()}
                                                        </div>
                                                        <p className="text-[8px] sm:text-[10px] text-gray-300 mt-0.5 uppercase tracking-tighter">
                                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Payment Status</span>
                                <div className="text-right">
                                    <p className="text-[10px] sm:text-xs text-gray-400">Total Paid</p>
                                    <p className="text-sm sm:text-base font-black text-green-600">रु {selectedBill.paidAmount.toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors uppercase tracking-widest text-xs sm:text-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingHistory;
