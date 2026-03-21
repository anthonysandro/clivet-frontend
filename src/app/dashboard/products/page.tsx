'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Plus, Search, Filter, Edit, 
  Trash2, Tag, Loader2, AlertCircle,
  Globe, MessageSquare, Ban, ChevronDown,
  Eye, EyeOff, RotateCcw, Lock // ✅ Nuevos iconos
} from 'lucide-react';
import ProductForm from './components/ProductForm';
import { ProductService, Product } from '@/services/productService';
import { ConfigService, ServiceType, ServiceCategory } from '@/services/configService';

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  
  // ✅ Estado para controlar la visualización de inactivos (Soft Delete)
  const [showInactive, setShowInactive] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ Pasamos el flag showInactive al servicio
      const [productsData, typesData] = await Promise.all([
        ProductService.getAll(showInactive),
        ConfigService.getServiceTypes()
      ]);
      
      setProducts(productsData);
      setTypes(typesData);
      
      const allCategories: ServiceCategory[] = [];
      for (const type of typesData) {
        const cats = await ConfigService.getCategories(type.serviceTypeId!);
        allCategories.push(...cats);
      }
      setCategories(allCategories);
    } catch (error) {
      console.error("Error al sincronizar el catálogo:", error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]); // ✅ Recargar cuando cambie el toggle de inactivos

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const getTypeName = (id: string) => types.find(t => t.serviceTypeId === id)?.name || 'Desconocido';
  const getCategoryName = (id: string) => categories.find(c => c.categoryId === id)?.name || 'General';

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(p.categoryId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChannel = 
      channelFilter === 'ALL' || 
      p.bookingChannels?.includes(channelFilter);

    return matchesSearch && matchesChannel;
  });

  const handleDelete = async (product: Product) => {
    if (product.isLocked) {
      alert("Este ítem está bloqueado por el sistema y no puede ser modificado.");
      return;
    }
    
    if (!confirm(`¿Estás seguro de dar de baja a "${product.name}"? Pasará a la papelera.`)) return;
    
    try {
      await ProductService.delete(product.productId!);
      await loadInitialData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar el producto");
    }
  };

  const handleRestore = async (product: Product) => {
    try {
      await ProductService.update(product.productId!, { isActive: true });
      await loadInitialData();
    } catch (error) {
      alert("Error al restaurar el producto");
    }
  };

  const handleEdit = (product: Product) => {
    if (product.isLocked) {
      alert("Este ítem está bloqueado (tiene stock o citas activas). No se puede editar.");
      return;
    }
    setEditingProduct(product);
    setShowForm(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-left">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter uppercase">
            <Package className="text-indigo-600" size={36} /> Catálogo Maestro
          </h1>
          <p className="text-gray-500 font-medium italic">Gestión de productos y servicios con integridad de datos.</p>
        </div>
        
        <div className="flex gap-4">
          {/* ✅ Switch Visual para Inactivos */}
          <button 
            onClick={() => setShowInactive(!showInactive)}
            className={`px-6 py-4 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest border-2 ${
              showInactive 
                ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-lg shadow-amber-100' 
                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
            }`}
          >
            {showInactive ? <Eye size={18} /> : <EyeOff size={18} />}
            {showInactive ? 'Viendo Papelera' : 'Ver Inactivos'}
          </button>

          <button 
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-2xl shadow-indigo-100 font-black uppercase text-xs tracking-widest active:scale-95"
          >
            <Plus size={20} /> Nuevo Registro
          </button>
        </div>
      </header>

      {/* FILTROS (Search y Channel Filter se mantienen igual) */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
         {/* ... (Contenido de búsqueda y selector de canales anterior) */}
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50 overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando catálogo...</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Item / Clasificación</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Estado</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Línea / Precio</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Stock</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((item) => (
                <tr key={item.productId} className={`transition-all group ${!item.isActive ? 'bg-gray-50/40 opacity-70' : 'hover:bg-indigo-50/20'}`}>
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center overflow-hidden border ${!item.isActive ? 'grayscale' : 'bg-gray-100'}`}>
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Tag size={24} />}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-base mb-2">{item.name}</p>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase border border-indigo-100">
                          {getCategoryName(item.categoryId)}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  {/* COLUMNA DE ESTADO DINÁMICO */}
                  <td className="p-8 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {item.isLocked && (
                        <span className="flex items-center gap-1 text-[8px] font-black text-amber-600 uppercase mb-1">
                          <Lock size={10} /> Bloqueado
                        </span>
                      )}
                      {!item.isActive ? (
                        <span className="bg-red-50 text-red-600 text-[9px] font-black px-4 py-1.5 rounded-full border border-red-100 uppercase tracking-tighter">Baja Lógica</span>
                      ) : (
                        <span className="bg-green-50 text-green-600 text-[9px] font-black px-4 py-1.5 rounded-full border border-green-100 uppercase tracking-tighter">Activo</span>
                      )}
                    </div>
                  </td>

                  <td className="p-8 text-center uppercase font-bold text-[10px] text-gray-500">
                    <p className="mb-1">{getTypeName(item.serviceTypeId)}</p>
                    <p className="text-gray-900 font-black text-sm">S/ {item.price.toFixed(2)}</p>
                  </td>
                  
                  <td className="p-8 text-center">
                    <p className={`font-black text-sm ${item.stock === 0 ? 'text-red-400' : 'text-gray-700'}`}>
                      {item.stock}
                    </p>
                  </td>

                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      {item.isActive ? (
                        <>
                          <button 
                            onClick={() => handleEdit(item)} 
                            disabled={item.isLocked}
                            className={`p-3 rounded-xl transition-all ${item.isLocked ? 'text-gray-200' : 'hover:bg-indigo-50 hover:text-indigo-600 text-gray-400'}`}
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item)} 
                            disabled={item.isLocked}
                            className={`p-3 rounded-xl transition-all ${item.isLocked ? 'text-gray-200' : 'hover:bg-red-50 hover:text-red-500 text-gray-400'}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleRestore(item)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                          <RotateCcw size={14} /> Restaurar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ProductForm 
          initialData={editingProduct} 
          onClose={() => { setShowForm(false); setEditingProduct(null); }} 
          onSuccess={() => {
            setShowForm(false);
            setEditingProduct(null);
            loadInitialData();
          }} 
        />
      )}
    </div>
  );
}