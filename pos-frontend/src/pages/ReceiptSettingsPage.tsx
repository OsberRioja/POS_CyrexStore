// pages/ReceiptSettingsPage.tsx
import React from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import ReceiptSettings from '../components/ReceiptSettings';

interface ReceiptSettingsPageProps {
  onBack: () => void;
}

const ReceiptSettingsPage: React.FC<ReceiptSettingsPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Volver a Configuración
              </button>
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Configuración del Comprobante
                  </h1>
                  <p className="text-sm text-gray-600">
                    Personaliza la apariencia de tus comprobantes de venta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ReceiptSettings />
        </div>
      </div>
    </div>
  );
};

export default ReceiptSettingsPage;