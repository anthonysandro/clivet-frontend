'use client';

import React, { useState, useEffect } from 'react';
import { ConfigService, ServiceType, ServiceCategory } from '@/services/configService';
import { ProductService, Product } from '@/services/productService'; 
import { BookingChannelService, BookingChannel as DBBookingChannel } from '@/services/bookingChannelService';
import { getIconByName } from '@/utils/iconHelper';
import ImageUploader from './ImageUploader';
import { Save, X, Loader2, AlertCircle, Ban } from 'lucide-react';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Product | null;
}

export default function ProductForm({ onClose, onSuccess, initialData }: ProductFormProps) {
  const isEditing = !!initialData;

  // Estados de datos maestros
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [availableChannels, setAvailableChannels] = useState<DBBookingChannel[]>([]);
  const [existingItems, setExistingItems] = useState<Product[]>([]); 
  
  // Estados de control
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del Formulario
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    serviceTypeId: initialData?.serviceTypeId || '',
    categoryId: initialData?.categoryId || '',
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    bookingChannels: initialData?.bookingChannels || ['NONE'] as string[]
  });
  
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');

  // Carga inicial de datos (Tipos, Productos para duplicados y Canales)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [typesData, productsData, channelsData] = await Promise.all([
          ConfigService.getServiceTypes(),
          ProductService.getAll(),
          BookingChannelService.getAll()
        ]);
        
        setTypes(typesData.filter(t => t.isActive));
        setExistingItems(productsData);
        // Filtrar solo canales activos definidos por el usuario
        setAvailableChannels(channelsData.filter(c => c.isActive));
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
        setError("Error al cargar la configuración del sistema.");
      } finally {
        setLoadingInitial(false);
      }
    };
    loadData();
  }, []);

  // Carga de categorías reactiva al tipo de servicio
  useEffect(() => {
    const loadCategories = async () => {
      if (!formData.serviceTypeId) {
        setCategories([]);
        return;
      }
      try {
        const data = await ConfigService.getCategories(formData.serviceTypeId);
        setCategories(data.filter(c => c.isActive));
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    };
    loadCategories();
  }, [formData.serviceTypeId]);

  // Lógica de selección de canales (Excluyente con NONE)
  const toggleChannel = (channelName: string) => {
    setFormData(prev => {
      let newChannels = [...prev.bookingChannels];

      if (channelName === 'NONE') {
        return { ...prev, bookingChannels: ['NONE'] };
      }
      
      // Si elige un canal, quitamos 'NONE'
      newChannels = newChannels.filter(c => c !== 'NONE');

      if (newChannels.includes(channelName)) {
        newChannels = newChannels.filter(c => c !== channelName);
      } else {
        newChannels.push(channelName);
      }

      // Si no queda ninguno, por defecto es 'NONE'
      if (newChannels.length === 0) newChannels = ['NONE'];
      
      return { ...prev, bookingChannels: newChannels };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.serviceTypeId || !formData.categoryId) {
      setError("Faltan datos obligatorios: Línea de Negocio o Categoría.");
      return;
    }

    // Validación de Duplicados en Frontend
    if (!isEditing || (initialData && initialData.name !== formData.name)) {
      const isDuplicate = existingItems.some(
        (item) => item.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
      );
      if (isDuplicate) {
        setError(`El nombre "${formData.name.trim()}" ya está en uso.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const productPayload: Product = {
        name: formData.name.trim(),
        serviceTypeId: formData.serviceTypeId,
        categoryId: formData.categoryId,
        price: formData.price,
        stock: formData.stock,
        imageUrl: imageUrl, 
        bookingChannels: formData.bookingChannels as any[],
        isActive: true,
        productId: initialData?.productId || ''
      };

      if (isEditing && initialData?.productId) {
        await ProductService.update(initialData.productId, productPayload);
      } else {
        await ProductService.create(productPayload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al procesar el registro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">
              {isEditing ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Sincronización de Catálogo</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* SECCIÓN DE CANALES DINÁMICOS */}
          <div className="animate-in slide-in-from-top-4 duration-500">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
              Canales de Agendamiento (Desde Configuración)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableChannels.map((channel) => {
                const isActive = formData.bookingChannels.includes(channel.name);
                return (
                  <button
                    key={channel.bookingChannelId}
                    type="button"
                    onClick={() => toggleChannel(channel.name)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                      isActive 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' 
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                      {getIconByName(channel.name === 'Whatsapp' ? 'MessageSquare' : 'Globe', 20)}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-center">{channel.name}</span>
                  </button>
                );
              })}
              
              {/* Opción NONE fija */}
              <button
                type="button"
                onClick={() => toggleChannel('NONE')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                  formData.bookingChannels.includes('NONE')
                    ? 'border-red-500 bg-red-50 text-red-500 shadow-lg shadow-red-100'
                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <Ban size={20} />
                <span className="text-[9px] font-black uppercase tracking-tighter text-center">No se agenda</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <ImageUploader 
            currentImage={imageUrl} 
            onImageUploaded={(url) => setImageUrl(url)} 
          />

          {/* NOMBRE */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre del Item</label>
            <input 
              required className="w-full p-5 rounded-2xl border-none bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-gray-800 transition-all"
              placeholder="Ej: Consulta Veterinaria General"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* LÍNEA DE NEGOCIO */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Línea de Negocio</label>
              <select 
                required 
                className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-xs appearance-none cursor-pointer"
                value={formData.serviceTypeId}
                onChange={e => setFormData({...formData, serviceTypeId: e.target.value, categoryId: ''})}
              >
                <option value="">Seleccione...</option>
                {types.map(t => <option key={t.serviceTypeId} value={t.serviceTypeId}>{t.name}</option>)}
              </select>
            </div>

            {/* CATEGORÍA */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
              <select 
                required 
                disabled={!formData.serviceTypeId}
                className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-xs appearance-none cursor-pointer disabled:opacity-30"
                value={formData.categoryId}
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
              >
                <option value="">{formData.serviceTypeId ? 'Seleccione...' : 'Elija línea primero'}</option>
                {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* PRECIO */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Precio (S/)</label>
              <input 
                type="number" step="0.01" min="0"
                className="w-full p-5 bg-gray-50 border-none rounded-2xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-600 outline-none" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
              />
            </div>
            {/* STOCK */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Stock Inicial</label>
              <input 
                type="number" min="0"
                className="w-full p-5 bg-gray-50 border-none rounded-2xl font-black text-gray-700 focus:ring-2 focus:ring-indigo-600 outline-none" 
                value={formData.stock} 
                onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
        </div>

        {/* FOOTER ACCIONES */}
        <div className="p-8 bg-gray-50/50 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-gray-400 uppercase text-[10px] tracking-widest hover:text-gray-600 transition">
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || loadingInitial}
            className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20}/>
            ) : (
              <><Save size={20}/> {isEditing ? 'Actualizar Registro' : 'Guardar Registro'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}