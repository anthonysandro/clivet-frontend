'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Search, Edit2, Save, X,
  Loader2, CheckCircle2, XCircle, Phone, Clock, Trash2,
} from 'lucide-react';
import { BranchService, Branch } from '@/services/branchService';

export default function BranchesPage() {
  const [branches, setBranches]       = useState<Branch[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');

  // Formulario
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formName, setFormName]       = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone]     = useState('');
  const [formSchedule, setFormSchedule] = useState('');
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
    setFormSchedule('');
    setFormIsActive(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (branch: Branch) => {
    setEditingId(branch.branchId!);
    setFormName(branch.name);
    setFormAddress(branch.address);
    setFormPhone(branch.phone);
    setFormSchedule(branch.schedule);
    setFormIsActive(branch.isActive ?? true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name:     formName.trim(),
        address:  formAddress.trim(),
        phone:    formPhone.trim(),
        schedule: formSchedule.trim(),
        isActive: formIsActive,
      };

      if (editingId) {
        await BranchService.update(editingId, payload);
      } else {
        await BranchService.create(payload);
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`¿Desactivar la sede "${branch.name}"?`)) return;
    try {
      await BranchService.delete(branch.branchId!);
      loadData();
    } catch (error) {
      alert('Error al desactivar la sede');
    }
  };

  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-4xl mx-auto text-left">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <MapPin className="text-indigo-600" /> Sedes
          </h1>
          <p className="text-gray-500 font-medium italic">
            Gestiona las sucursales y locales de la clínica.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg font-bold uppercase text-xs"
        >
          <Plus size={18} /> Nueva Sede
        </button>
      </header>

      {/* BUSCADOR */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o dirección..."
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
        ) : filteredBranches.length > 0 ? (
          filteredBranches.map(branch => (
            <div
              key={branch.branchId}
              className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-start group hover:border-indigo-200 transition-all shadow-sm"
            >
              {/* Info */}
              <div className="flex items-start gap-4">
                {/* Badge estado */}
                {branch.isActive ? (
                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase mt-1 shrink-0">
                    <CheckCircle2 size={12} /> Activo
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black uppercase mt-1 shrink-0">
                    <XCircle size={12} /> Inactivo
                  </div>
                )}

                <div>
                  <p className="font-bold text-gray-800 text-lg leading-tight">{branch.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {branch.address && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                        <MapPin size={11} /> {branch.address}
                      </span>
                    )}
                    {branch.phone && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                        <Phone size={11} /> {branch.phone}
                      </span>
                    )}
                    {branch.schedule && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                        <Clock size={11} /> {branch.schedule}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(branch)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar sede"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(branch)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Desactivar sede"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <MapPin className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-400 font-medium">No se encontraron sedes.</p>
            <p className="text-gray-300 text-sm mt-1">Crea la primera sede con el botón superior.</p>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200"
          >
            {/* Header modal */}
            <div className="p-8 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">
                {editingId ? 'Actualizar Sede' : 'Nueva Sede'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Campos */}
            <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto">

              {/* Nombre */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Nombre de la Sede *
                </label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Sede Miraflores, Local Principal..."
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none"
                />
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Dirección *
                </label>
                <input
                  required
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ej: Av. Larco 123, Miraflores"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ej: +51 999 888 777"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none"
                />
              </div>

              {/* Horario */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Horario de Atención
                </label>
                <input
                  type="text"
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                  placeholder="Ej: Lun-Vie 09:00-18:00, Sáb 09:00-14:00"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-800 outline-none"
                />
              </div>

              {/* Toggle isActive */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-700">Estado de la Sede</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    {formIsActive ? 'Visible y disponible para citas' : 'Oculta / Deshabilitada'}
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

            {/* Footer modal */}
            <div className="p-8 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 font-bold text-gray-400 uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formName || !formAddress}
                className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-gray-400 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <><Save size={18} /> Guardar Sede</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
