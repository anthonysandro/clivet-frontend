'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Search, Edit2, Save, X,
  Loader2, CheckCircle2, XCircle, Phone, Trash2,
} from 'lucide-react';
import { BranchService, Branch } from '@/services/branchService';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS DEL FORMULARIO ---
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await BranchService.getAll();
      setBranches(data);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setFormIsActive(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (branch: Branch) => {
    setEditingId(branch.branchId);
    setFormName(branch.name);
    setFormAddress(branch.address);
    setFormPhone(branch.phone);
    setFormIsActive(branch.isActive ?? true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) return;

    setIsSubmitting(true);
    try {
      // ✅ Payload ajustado a lo que el backend espera (Pick<Branch, 'name' | 'address' | 'phone'>)
      const payload = {
        name: formName.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        isActive: formIsActive,
      };

      if (editingId) {
        await BranchService.update(editingId, payload);
      } else {
        await BranchService.create(payload);
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al procesar la sede');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`¿Estás seguro de desactivar la sede "${branch.name}"? Esta acción no se puede deshacer fácilmente.`)) return;
    try {
      await BranchService.delete(branch.branchId);
      await loadData();
    } catch (error) {
      alert('Error al desactivar la sede');
    }
  };

  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto text-left">
      {/* HEADER */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <MapPin className="text-indigo-600" size={36} strokeWidth={3} /> Sucursales
          </h1>
          <p className="text-gray-500 font-medium italic mt-1">
            Gestión de locales físicos y puntos de atención de CliVet.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black uppercase text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Registrar Sede
        </button>
      </header>

      {/* BUSCADOR */}
      <div className="relative mb-8">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
        <input
          type="text"
          placeholder="Filtrar sedes por nombre o ubicación..."
          className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 placeholder:text-gray-300 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTADO TIPO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-200" size={64} />
          </div>
        ) : filteredBranches.length > 0 ? (
          filteredBranches.map(branch => (
            <div
              key={branch.branchId}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between group hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <MapPin size={28} />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(branch)}
                    className="p-3 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(branch)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-black text-gray-800 text-xl tracking-tight">{branch.name}</h3>
                   {branch.isActive ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                   )}
                </div>
                <p className="text-gray-500 font-bold text-sm mb-4 line-clamp-1">{branch.address}</p>
                
                <div className="flex items-center gap-4 border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <Phone size={12} className="text-indigo-300" /> {branch.phone || 'Sin tel.'}
                  </div>
                  <div className={`ml-auto text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                      branch.isActive 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                    {branch.isActive ? 'Operativa' : 'Inactiva'}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
            <MapPin className="mx-auto text-gray-200 mb-4" size={60} strokeWidth={1} />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No hay sedes registradas</p>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden transition-all text-left"
          >
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
                {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: CliVet Miraflores"
                  className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dirección Física</label>
                <input
                  required
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Av. Ejemplo 123, Lima"
                  className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="999 888 777"
                  className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                <div>
                  <p className="text-xs font-black text-gray-700 uppercase tracking-tight">Estado Operativo</p>
                  <p className="text-[10px] text-gray-400 font-bold italic">
                    {formIsActive ? 'Abierta al público' : 'Cerrada temporalmente'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${
                    formIsActive ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 ${
                      formIsActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-10 bg-gray-50 flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || !formName || !formAddress}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:bg-gray-400 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <><Save size={20} strokeWidth={3} /> Guardar Cambios</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}