'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, SimpleUser, UserPlus, StopCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', role: 'ADMIN' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        setUsers(await res.json());
      } else {
        toast.error('Ruxsat etilmagan! Faqat SuperAdmin ko\'ra oladi.');
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      toast.success('Xodim qo\'shildi!');
      setShowModal(false);
      setFormData({ username: '', password: '', name: '', role: 'ADMIN' });
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Qo\'shishda xatolik');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Xodimlar (Admins)
          </h1>
          <p className="text-gray-500 mt-1">Tizimga kirish ruxsati bor xodimlarni boshqarish</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Yangi Xodim
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-900">Ism(Name)</th>
              <th className="px-6 py-4 font-medium text-gray-900">Login(Username)</th>
              <th className="px-6 py-4 font-medium text-gray-900">Rol</th>
              <th className="px-6 py-4 font-medium text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">{u.name || '-'}</td>
                <td className="px-6 py-4 font-medium">{u.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 ${u.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>
                    {u.status === 'ACTIVE' ? <CheckCircle className="w-4 h-4" /> : <StopCircle className="w-4 h-4" />}
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">Xodimlar topilmadi</div>
        )}
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-lg text-gray-900">Yangi Xodim qo'shish</h3>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ism</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-gray-200 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tizimga kirish logini</label>
                <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border-gray-200 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border-gray-200 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xodim roli</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border-gray-200 rounded-lg px-4 py-2 bg-gray-50 outline-none">
                  <option value="ADMIN">ADMIN (Oddiy Xodim)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Boshqaruvchi)</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium">Bekor qilish</button>
                <button type="submit" className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition font-medium">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
