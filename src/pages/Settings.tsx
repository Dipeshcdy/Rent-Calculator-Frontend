import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../lib/axios';

const Settings = () => {
    const [rates, setRates] = useState({
        internetPerDevice: '200',
        electricityPerUnit: '10',
        electricityServiceCharge: '50'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            setRates({
                internetPerDevice: data.internetPerDevice?.toString() || '200',
                electricityPerUnit: data.electricityPerUnit?.toString() || '10',
                electricityServiceCharge: data.electricityServiceCharge?.toString() || '50'
            });
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            // Parse to numbers for the API
            const numericRates = {
                internetPerDevice: parseFloat(rates.internetPerDevice) || 0,
                electricityPerUnit: parseFloat(rates.electricityPerUnit) || 0,
                electricityServiceCharge: parseFloat(rates.electricityServiceCharge) || 0
            };
            await api.post('/settings', numericRates);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error: any) {
            console.error('Failed to save settings', error);
            const data = error.response?.data;
            const errorText = data?.detail || data?.error || data?.message || error.message || 'Failed to save settings';
            setMessage({ type: 'error', text: errorText });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setChangingPassword(true);
        setPasswordMessage(null);
        try {
            await api.post('/auth/change-password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Failed to change password', error);
            const data = error.response?.data;
            const errorText = data?.detail || data?.error || data?.message || error.message || 'Failed to change password';
            setPasswordMessage({ type: 'error', text: errorText });
        } finally {
            setChangingPassword(false);
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500">Manage global billing rates and security settings</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="card bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                Internet Charge (Per Device)
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-indigo-600 transition-colors">रु</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={rates.internetPerDevice}
                                    onChange={(e) => setRates({ ...rates, internetPerDevice: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                Electricity Rate (Per Unit)
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-indigo-600 transition-colors">रु</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={rates.electricityPerUnit}
                                    onChange={(e) => setRates({ ...rates, electricityPerUnit: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                Electricity Service Charge
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-indigo-600 transition-colors">रु</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={rates.electricityServiceCharge}
                                    onChange={(e) => setRates({ ...rates, electricityServiceCharge: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono font-bold text-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="pt-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Security</h3>
                <p className="text-gray-500 mb-6">Update your account password</p>

                {passwordMessage && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 mb-6 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {passwordMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{passwordMessage.text}</span>
                    </div>
                )}

                <div className="card bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={changingPassword}
                                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {changingPassword ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Updating...
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;

