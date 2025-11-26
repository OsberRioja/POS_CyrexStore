import React, { useState } from 'react';
import { X, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChange: (newPassword: string) => Promise<void>;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  onPasswordChange
}) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'La contraseña debe tener al menos una letra minúscula';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'La contraseña debe tener al menos una letra mayúscula';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'La contraseña debe tener al menos un número';
    }
    if (!/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
      return 'La contraseña debe tener al menos un carácter especial';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const validationError = validatePassword(formData.newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await onPasswordChange(formData.newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ newPassword: '', confirmPassword: '' });
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: 'gray' };
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const isLong = password.length >= 8;

    const score = [hasLower, hasUpper, hasNumber, hasSpecial, isLong].filter(Boolean).length;

    switch (score) {
      case 5: return { strength: 'Muy fuerte', color: 'green' };
      case 4: return { strength: 'Fuerte', color: 'lime' };
      case 3: return { strength: 'Moderada', color: 'yellow' };
      case 2: return { strength: 'Débil', color: 'orange' };
      default: return { strength: 'Muy débil', color: 'red' };
    }
  };

  if (!isOpen) return null;

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Cambiar Contraseña
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Por seguridad, debes cambiar tu contraseña temporal
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
              <CheckCircle size={20} />
              <div>
                <p className="font-medium">¡Contraseña cambiada exitosamente!</p>
                <p className="text-sm">Cerrando automáticamente...</p>
              </div>
            </div>
          )}

          {/* Nueva Contraseña */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Ingresa tu nueva contraseña"
                disabled={loading || success}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={16} className="text-gray-500" />
                ) : (
                  <Eye size={16} className="text-gray-500" />
                )}
              </button>
            </div>
            
            {/* Indicador de fortaleza de contraseña */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Fortaleza:</span>
                  <span className={`font-medium text-${passwordStrength.color}-600`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-${passwordStrength.color}-500`}
                    style={{ 
                      width: `${(formData.newPassword.length > 0 ? getPasswordStrength(formData.newPassword).strength : 'Muy débil') === 'Muy débil' ? '20%' : 
                              getPasswordStrength(formData.newPassword).strength === 'Débil' ? '40%' :
                              getPasswordStrength(formData.newPassword).strength === 'Moderada' ? '60%' :
                              getPasswordStrength(formData.newPassword).strength === 'Fuerte' ? '80%' : '100%'}` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Confirma tu nueva contraseña"
                disabled={loading || success}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} className="text-gray-500" />
                ) : (
                  <Eye size={16} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Requisitos de contraseña */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">La contraseña debe contener:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className={formData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                • Al menos 8 caracteres
              </li>
              <li className={/(?=.*[a-z])/.test(formData.newPassword) ? 'text-green-600' : ''}>
                • Una letra minúscula
              </li>
              <li className={/(?=.*[A-Z])/.test(formData.newPassword) ? 'text-green-600' : ''}>
                • Una letra mayúscula
              </li>
              <li className={/(?=.*\d)/.test(formData.newPassword) ? 'text-green-600' : ''}>
                • Un número
              </li>
              <li className={/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(formData.newPassword) ? 'text-green-600' : ''}>
                • Un carácter especial (!@#$%^&* etc.)
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success || formData.newPassword !== formData.confirmPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cambiando...' : success ? '¡Listo!' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;