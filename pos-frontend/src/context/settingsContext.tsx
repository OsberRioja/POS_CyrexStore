import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ReceiptSettings {
  logo: string | null;
  companyName: string;
  address: string;
  phone: string;
}

interface SettingsContextType {
  receiptSettings: ReceiptSettings;
  updateReceiptSettings: (settings: Partial<ReceiptSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    logo: null,
    companyName: 'Mi Empresa',
    address: '',
    phone: ''
  });

  // Cargar configuración del localStorage al iniciar
  useEffect(() => {
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      setReceiptSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateReceiptSettings = (newSettings: Partial<ReceiptSettings>) => {
    const updatedSettings = { ...receiptSettings, ...newSettings };
    setReceiptSettings(updatedSettings);
    localStorage.setItem('receiptSettings', JSON.stringify(updatedSettings));
  };

  return (
    <SettingsContext.Provider value={{ receiptSettings, updateReceiptSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};