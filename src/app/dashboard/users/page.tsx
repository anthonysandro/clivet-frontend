'use client';
import React, { useEffect, useState } from 'react';
import { User, UserService } from '@/services/userService';
import { ConfigService, UserProfile } from '@/services/configService';
import { 
  Search, Edit, Plus, Mail, ShieldCheck, BrainCircuit, Loader2, X 
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // --- MODALES ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); 

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // --- FORMULARIOS ---
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [inviteForm, setInviteForm] = useState({ 
    name: '', 
    email: '', 
    profileId: '' 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredUsers(users.filter(u => 
      (u.name || '').toLowerCase().includes(term) || 
      (u.email || '').toLowerCase().includes(term)
    ));
  }, [searchTerm, users]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersData, profilesData] = await Promise.all([
        UserService.getAll(),
        ConfigService.getProfiles()
      ]);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setProfiles(profilesData.filter(p => p.isActive));
    } catch (e) { 
      console.error("Error cargando datos:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleOpenEdit = (user: User) => {
    setCurrentUser(user);
    // ✅ Cargamos todos los campos necesarios para el backend
    setEditForm({ 
      name: user.name, 
      profileId: user.profileId,
      phone: user.phone || '', 
      status: user.status 
    });
    setIsEditModalOpen(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.profileId) return alert("Selecciona un perfil");
    
    setIsSubmitting(true);
    try {
      await UserService.invite(inviteForm.email, inviteForm.name, inviteForm.profileId);
      setIsInviteModalOpen(false);
      setInviteForm({ name: '', email: '', profileId: '' });
      loadInitialData(); 
      alert(`Invitación enviada exitosamente.`);
    } catch (error) {
      alert('Error al invitar usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      // ✅ Enviamos solo los campos que el backend espera segun nuestro esquema Zod
      const payload = {
        name: editForm.name,
        profileId: editForm.profileId,
        status: editForm.status,
        phone: editForm.phone
      };

      await UserService.update(currentUser.userId, payload);
      setIsEditModalOpen(false);
      await loadInitialData();
    } catch (e) { 
      console.error("Error en update:", e);
      alert('Error actualizando usuario. Verifica la conexión con el servidor.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-left">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
            Personal y Accesos
          </h1>
          <p className="text-gray-500 font-medium italic">Configuración de equipo y permisos de IA</p>
        </div>
        <button 
          onClick={() => {
            if (profiles.length === 0) return alert("Crea perfiles en Configuración primero.");
            setInviteForm({ name: '', email: '', profileId: profiles[0]?.profileId || '' });
            setIsInviteModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-2xl shadow-indigo-100 transition-all font-black uppercase text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={20} /> Invitar Usuario
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm mb-8 flex items-center gap-3 border border-gray-100">
        <Search className="text-gray-300 ml-2" size={24} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o correo..." 
          className="w-full outline-none text-gray-700 font-bold bg-transparent placeholder:text-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black border-b border-gray-100">
            <tr>
              <th className="p-8 tracking-widest">Usuario</th>
              <th className="p-8 tracking-widest text-center">Perfil</th>
              <th className="p-8 tracking-widest text-center">Base IA</th>
              <th className="p-8 tracking-widest text-center">Estado</th>
              <th className="p-8 tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-indigo-200" size={48} /></td></tr>
            ) : filteredUsers.map(user => {
              const userProfile = profiles.find(p => p.profileId === user.profileId);
              return (
                <tr key={user.userId} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-base leading-none mb-1">{user.name}</p>
                        <p className="text-xs font-bold text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className="inline-flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-white border border-indigo-100 px-4 py-2 rounded-xl shadow-sm">
                      <ShieldCheck size={14} strokeWidth={3}/>
                      {userProfile?.name || 'SIN PERFIL'}
                    </span>
                  </td>
                  <td className="p-8 text-center">
                    <span className="inline-flex items-center gap-2 text-[10px] font-black text-purple-600 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
                      <BrainCircuit size={14} strokeWidth={3}/>
                      {userProfile?.aiRoleBase || 'N/A'}
                    </span>
                  </td>
                  <td className="p-8 text-center">
                    <span className={`text-[9px] font-black px-4 py-2 rounded-full border uppercase tracking-widest ${
                      user.status === 'ACTIVE' 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => handleOpenEdit(user)} 
                      className="p-4 text-gray-300 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 rounded-2xl transition-all"
                    >
                      <Edit size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- MODALES --- */}

      {/* 1. MODAL INVITAR */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden transition-all scale-100">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Invitar Colega</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSendInvite} className="p-10 space-y-6">
              <input required className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" placeholder="Nombre completo" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
              <input required type="email" className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" placeholder="Email corporativo" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Perfil de Acceso</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer" value={inviteForm.profileId} onChange={e => setInviteForm({...inviteForm, profileId: e.target.value})}>
                  {profiles.map(p => <option key={p.profileId} value={p.profileId}>{p.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-indigo-700 shadow-2xl shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar Invitación'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL EDITAR */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden">
             <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Editar Usuario</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nombre</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Perfil</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-600 font-black text-indigo-600 appearance-none cursor-pointer" value={editForm.profileId} onChange={e => setEditForm({...editForm, profileId: e.target.value})}>
                    {profiles.map(p => <option key={p.profileId} value={p.profileId}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Estado</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-600 font-black appearance-none cursor-pointer" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})}>
                    <option value="ACTIVE">ACTIVO</option>
                    <option value="DISABLED">BLOQUEADO</option>
                    <option value="PENDING">PENDIENTE</option>
                  </select>
                </div>
              </div>
              
              {/* ✅ Info de Base IA Dinámica */}
              <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100 flex items-center gap-4">
                <BrainCircuit className="text-purple-600" size={32} />
                <div>
                  <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Base IA Vincular</p>
                  <p className="text-sm font-black text-purple-700">
                    {profiles.find(p => p.profileId === editForm.profileId)?.aiRoleBase || 'GENERAL'}
                  </p>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95">
                {isSubmitting ? 'Guardando...' : 'Actualizar Perfil'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}