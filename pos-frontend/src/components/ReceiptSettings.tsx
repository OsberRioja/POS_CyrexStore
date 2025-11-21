// components/ReceiptSettings.tsx (versión mejorada)
import React, { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Upload, Save, Trash2, Building, MapPin, Phone, CheckCircle } from 'lucide-react';
import { useSettings } from '../context/settingsContext';

const ReceiptSettings: React.FC = () => {
  const { receiptSettings, updateReceiptSettings } = useSettings();
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phone: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar configuración existente al montar el componente
  useEffect(() => {
    setFormData({
      companyName: receiptSettings.companyName,
      address: receiptSettings.address,
      phone: receiptSettings.phone,
    });
    setLogoPreview(receiptSettings.logo);
  }, [receiptSettings]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido (JPG, PNG, GIF).');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setSaveSuccess(false); // Reset success message when changes are made
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSaveSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateReceiptSettings({
        ...formData,
        logo: logoPreview,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaveSuccess(false); // Reset success message when changes are made
  };

  const hasChanges = () => {
    return (
      formData.companyName !== receiptSettings.companyName ||
      formData.address !== receiptSettings.address ||
      formData.phone !== receiptSettings.phone ||
      logoPreview !== receiptSettings.logo
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header de la página */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Configuración del Comprobante</h1>
          <p className="text-blue-100 mt-1">
            Personaliza la apariencia de tus comprobantes de venta
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Sección del Logo */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-blue-600" />
              Logo de la Empresa
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir Logo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Seleccionar Archivo
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF hasta 2MB. Recomendado: 200x80px
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vista Previa del Logo
                </label>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 min-h-[150px] flex items-center justify-center">
                  {logoPreview ? (
                    <div className="text-center">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-20 max-w-full mx-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="mt-3 text-red-600 hover:text-red-800 text-sm flex items-center gap-1 mx-auto"
                      >
                        <Trash2 size={14} />
                        Eliminar Logo
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="bg-gray-200 rounded-lg w-32 h-20 flex items-center justify-center mx-auto mb-2">
                        <Building className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm">No hay logo seleccionado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de la Empresa */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Información de la Empresa
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa el nombre de tu empresa"
                  required
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin size={16} />
                  Dirección
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa la dirección de tu empresa"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone size={16} />
                  Teléfono
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa el teléfono de contacto"
                />
              </div>
            </div>
          </div>

          {/* Vista Previa del Comprobante */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Vista Previa del Comprobante
            </h2>
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="bg-white p-6 border border-gray-300 max-w-md mx-auto shadow-sm">
                {/* Encabezado */}
                <div className="text-center mb-4 border-b pb-4">
                  {logoPreview && (
                    <div className="mb-2">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-12 mx-auto object-contain"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-bold">{formData.companyName || 'Nombre de Empresa'}</h3>
                  {formData.address && (
                    <p className="text-sm text-gray-600">{formData.address}</p>
                  )}
                  {formData.phone && (
                    <p className="text-sm text-gray-600">Tel: {formData.phone}</p>
                  )}
                  <p className="text-sm font-semibold mt-2">COMPROBANTE DE VENTA</p>
                </div>

                {/* Información de ejemplo */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span>Cliente de Ejemplo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span>{new Date().toLocaleDateString('es-BO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold">Bs 100.00</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                Esta es una vista previa básica. El comprobante real incluirá todos los detalles de la venta.
              </p>
            </div>
          </div>

          {/* Botones de Acción y Mensaje de Éxito */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4">
            <div className="flex-1">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-md">
                  <CheckCircle size={18} />
                  <span className="font-medium">Configuración guardada correctamente</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading || !formData.companyName.trim() || !hasChanges()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={18} />
                {isLoading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptSettings;