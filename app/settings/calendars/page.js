'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CalendarsPage() {
    const [calendars, setCalendars] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/users/me/calendars', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setCalendars(data.calendars);
        }
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users/me/calendars', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: newUrl, name: newName })
        });
        if (res.ok) {
            setNewUrl('');
            setNewName('');
            fetchCalendars();
        } else {
            alert('Failed to add calendar');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this calendar?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/users/me/calendars?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchCalendars();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">External Calendars</h1>
                    <Link href="/" className="text-blue-600 hover:underline">Back to Dashboard</Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h2 className="text-lg font-semibold mb-4">Add Calendar (ICS)</h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Calendar Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. Work Calendar"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ICS URL</label>
                            <input
                                type="url"
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://calendar.google.com/..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                            Add Calendar
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Your Calendars</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : calendars.length === 0 ? (
                        <p className="text-gray-500">No external calendars connected.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {calendars.map(cal => (
                                <li key={cal._id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{cal.name}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-xs">{cal.url}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cal._id)}
                                        className="text-red-600 hover:text-red-900 text-sm"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
