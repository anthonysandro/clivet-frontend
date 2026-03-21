'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Plus, Search, Edit2, Save, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { BookingChannelService, BookingChannel } from '@/services/bookingChannelService';

export default function BookingChannelsPage() {
  const [channels, setChannels] = useState<BookingChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el formulario (Nuevo/Editar)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIsActive, setFormIsActive] = useState(true); // ✅ Nuevo atributo
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await BookingChannelService.getAll();
      setChannels(data);
    } catch (error) { 
      console.error("Error al cargar canales:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  // 📝 Req 2.1 y 3.1: Formatear nombre (Primera Mayúscula)
  const handleNameChange = (val: string) => {
    if (val.length === 0) { setFormName(''); return; }
    const formatted = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    setFormName(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { 
        name: formName, 
        isActive: formIsActive // ✅ Incluido en el payload
      };

      if (editingId) {
        await BookingChannelService.update(editingId, payload);
      } else {
        await BookingChannelService.create(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormName('');
      setFormIsActive(true);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al procesar la solicitud");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const startEdit = (channel: BookingChannel) => {
    setEditingId(channel.bookingChannelId!);
    setFormName(channel.name);
    setFormIsActive(channel.isActive ?? true); // ✅ Carga el estado actual
    setShowForm(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormIsActive(true); // Default para nuevos registros
    setShowForm(true);
  };

  // 🔍 Req 1.1: Búsqueda por nombre
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl mx-auto text-left">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <Globe className="text-indigo-600" /> Canales de Reserva
          </h1>
          <p className="text-gray-500 font-medium italic">Gestiona los medios por los cuales tus clientes agendan.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg font-bold uppercase text-xs"
        >
          <Plus size={18} /> Nuevo Canal
        </button>
      </header>

      {/* BUSCADOR */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar canal..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTADO */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredChannels.length > 0 ? (
          filteredChannels.map(channel => (
            <div key={channel.bookingChannelId} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                {/* Indicador visual de Activo/Inactivo */}
                {channel.isActive ? (
                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    <CheckCircle2 size={12} /> Activo
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    <XCircle size={12} /> Inactivo
                  </div>
                )}
                <span className="font-bold text-gray-700 text-lg">{channel.name}</span>
              </div>
              <button 
                onClick={() => startEdit(channel)} 
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Editar canal"
              >
                <Edit2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No se encontraron canales de reserva.</p>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO / EDICIÓN */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200"
          >
            <div className="p-8 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">
                {editingId ? 'Actualizar Canal' : 'Nuevo Canal'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Campo Nombre */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Canal</label>
                <input 
                  required
                  autoFocus
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Whatsapp, Web, Presencial..."
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none"
                />
              </div>

              {/* Toggle isActive (Atributo Activo/Inactivo) */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent transition-all">
                <div>
                  <p className="text-sm font-bold text-gray-700">Estado del Canal</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    {formIsActive ? 'Visible para el sistema' : 'Oculto / Deshabilitado'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    formIsActive ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                      formIsActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="flex-1 font-bold text-gray-400 uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !formName}
                className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-gray-400 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18}/>
                ) : (
                  <><Save size={18}/> Guardar Cambios</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}