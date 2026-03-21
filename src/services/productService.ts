import api from '@/api';

export interface Product {
  productId?: string;
  tenantId?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  // Jerarquía obligatoria
  serviceTypeId: string;   
  categoryId: string;  
  sku?: string;
  imageUrl?: string;
  
  // ✅ ATRIBUTOS DE ESTADO AÑADIDOS
  isActive: boolean;       // Control de borrado lógico
  isLocked?: boolean;      // Bloqueo por transacciones activas (opcional)
  
  bookingChannels: string[]; 
  updatedAt?: string;
  createdAt?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

export const ProductService = {
  /**
   * ✅ Actualizado para soportar el parámetro de inactivos
   */
  getAll: async (includeInactive: boolean = false): Promise<Product[]> => {
    const response = await api.get(`/products?includeInactive=${includeInactive}`);
    // Manejamos tanto si viene el array directo como si viene dentro de .items
    return response.data.items || response.data;
  },

  /**
   * Registra un nuevo item en el catálogo
   */
  create: async (product: Product): Promise<Product> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  /**
   * Actualiza datos (incluyendo estados isActive/isLocked)
   */
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Ahora el delete en el servicio llama al endpoint que hace el Soft Delete
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
  /**
   * Obtiene una URL firmada de S3 para subir la imagen del producto
   */
  getPresignedUrl: async (fileName: string, contentType: string): Promise<PresignedUrlResponse> => {
    const response = await api.post('/products/upload-url', { 
      fileName, 
      fileType: contentType 
    });
    return response.data;
  },

  /**
   * Elimina un archivo de S3 a través del backend
   */
  deleteS3File: async (fileUrl: string): Promise<{ message: string }> => {
    // Validamos que exista una URL antes de intentar procesarla
    if (!fileUrl || !fileUrl.includes('.com/')) {
      throw new Error("URL de archivo inválida para eliminación.");
    }

    // Extraemos la "Key" (ruta) de la URL completa de S3
    const fileKey = fileUrl.split('.com/')[1];
    
    const response = await api.post('/products/delete-file', { 
      fileKey 
    });
    return response.data;
  }
};