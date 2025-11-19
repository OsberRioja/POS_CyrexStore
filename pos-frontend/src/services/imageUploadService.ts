export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  publicId?: string;
}

export const imageUploadService = {
  async uploadImage(file: File): Promise<UploadResult> {
    try {
      // Validaciones
      const validationError = this.validateImage(file);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Intentar Cloudinary primero
      if (this.hasCloudinaryConfig()) {
        console.log('📤 Subiendo a Cloudinary...');
        const result = await this.uploadToCloudinary(file);
        if (result.success) {
          console.log('✅ Imagen subida a Cloudinary:', result.url);
          return result;
        } else {
          console.warn('❌ Falló Cloudinary, usando método local:', result.error);
        }
      }

      // Fallback a almacenamiento local
      console.log('📤 Subiendo localmente...');
      return await this.uploadLocal(file);
    } catch (error) {
      console.error('💥 Error uploading image:', error);
      return { 
        success: false, 
        error: 'Error al subir la imagen. Intenta con una imagen más pequeña o diferente formato.' 
      };
    }
  },

  validateImage(file: File): string | null {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return 'Formato no válido. Usa JPG, PNG, WEBP o GIF.';
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'La imagen es muy grande. Máximo 5MB.';
    }

    return null;
  },

  hasCloudinaryConfig(): boolean {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    const hasConfig = !!(cloudName && uploadPreset);
    console.log('🔧 Config Cloudinary:', { cloudName, uploadPreset, hasConfig });
    
    return hasConfig;
  },

  async uploadToCloudinary(file: File): Promise<UploadResult> {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // VERIFICACIÓN CRÍTICA
    if (!cloudName || cloudName === 'tu_cloud_name' || !uploadPreset) {
      return {
        success: false,
        error: 'Configuración de Cloudinary incompleta. Revisa las variables de entorno.'
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    // NO añadir cloud_name al formData - va en la URL

    try {
      console.log('🌐 Enviando a Cloudinary...', {
        cloudName,
        uploadPreset,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          // NO enviar headers de Authorization
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cloudinary response not OK:', response.status, errorText);
        return {
          success: false,
          error: `Error ${response.status} desde Cloudinary`
        };
      }

      const data = await response.json();
      console.log('📨 Respuesta de Cloudinary:', data);

      if (data.secure_url) {
        return {
          success: true,
          url: data.secure_url,
          publicId: data.public_id
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Error desconocido de Cloudinary'
        };
      }
    } catch (error) {
      console.error('💥 Cloudinary upload error:', error);
      return {
        success: false,
        error: 'Error de conexión con Cloudinary. Verifica tu conexión a internet.'
      };
    }
  },

  async uploadLocal(file: File): Promise<UploadResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          success: true,
          url: reader.result as string
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Error leyendo el archivo localmente'
        });
      };
      reader.readAsDataURL(file);
    });
  }
};