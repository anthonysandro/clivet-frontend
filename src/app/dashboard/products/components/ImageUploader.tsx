'use client';

import React, { useState } from 'react';
import { ProductService } from '@/services/productService';
import { ImageIcon, Loader2, X, UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
}

export default function ImageUploader({ onImageUploaded, currentImage }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');

  // Función interna para limpiar archivos en S3
  const purgeFile = async (url: string) => {
    try {
      if (url && url.includes('s3.amazonaws.com')) {
        await ProductService.deleteS3File(url);
      }
    } catch (error) {
      console.error("Error al eliminar archivo huérfano en S3:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor sube una imagen válida");
      return;
    }

    setUploading(true);
    
    // LIMPIEZA: Si ya existe una imagen previa, la borramos antes de subir la nueva
    if (preview) {
      await purgeFile(preview);
    }

    try {
      // 1. Obtener URL firmada del backend
      const { uploadUrl, fileUrl } = await ProductService.getPresignedUrl(
        `products/${Date.now()}-${file.name.replace(/\s+/g, '_')}`, // Limpiamos espacios en el nombre
        file.type
      );

      // 2. Subir directamente a S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // 3. Actualizar vista y notificar al padre
      setPreview(fileUrl);
      onImageUploaded(fileUrl);
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
      // Limpiar el input para permitir subir el mismo archivo si se desea
      e.target.value = '';
    }
  };

  const removeImage = async (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar triggers accidentales
    e.stopPropagation();

    if (!preview) return;

    const confirmDelete = confirm("¿Deseas quitar esta imagen?");
    if (!confirmDelete) return;

    setUploading(true);
    try {
      await purgeFile(preview);
      setPreview('');
      onImageUploaded('');
    } catch (error) {
      alert("No se pudo eliminar la imagen del servidor");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 w-full">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
        Fotografía del Producto
      </label>
      
      <div className="relative group overflow-hidden border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all aspect-video flex flex-col items-center justify-center cursor-pointer">
        {preview ? (
          <>
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover rounded-[2.5rem] transition-transform duration-500 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
               <button 
                type="button" 
                disabled={uploading}
                onClick={removeImage}
                className="p-4 bg-white/10 hover:bg-red-500 text-white rounded-2xl transition-all duration-300 transform hover:scale-110 active:scale-90 shadow-xl border border-white/20"
                title="Eliminar imagen"
               >
                 {uploading ? <Loader2 className="animate-spin" size={20} /> : <X size={20} />}
               </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <span className="text-[10px] font-black uppercase text-indigo-600 animate-pulse">Procesando...</span>
              </div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-full shadow-sm text-gray-300 group-hover:text-indigo-400 group-hover:shadow-indigo-100 transition-all">
                  <UploadCloud size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-500 group-hover:text-indigo-600 transition-colors">
                    Click para subir imagen
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    JPG, PNG o WEBP (Máx. 5MB)
                  </span>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Input oculto solo activo si no se está subiendo nada */}
        {!uploading && (
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="absolute inset-0 opacity-0 cursor-pointer" 
          />
        )}
      </div>
    </div>
  );
}