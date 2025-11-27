import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { passwordResetService } from '../services/passwordResetService';

interface ResetPasswordPageProps {
  token: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (formData.newPassword) {
      const errors = [];
      if (formData.newPassword.length < 8) errors.push('Al menos 8 caracteres');
      if (!/(?=.*[a-z])/.test(formData.newPassword)) errors.push('Una letra minúscula');
      if (!/(?=.*[A-Z])/.test(formData.newPassword)) errors.push('Una letra mayúscula');
      if (!/(?=.*\d)/.test(formData.newPassword)) errors.push('Un número');
      if (!/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(formData.newPassword)) errors.push('Un carácter especial');
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  }, [formData.newPassword]);

  // Validar el token al cargar la página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false);
        setTokenValid(false);
        setError('Token no proporcionado en el enlace.');
        return;
      }

      try {
        await passwordResetService.validateToken(token);
        setTokenValid(true);
      } catch (err: any) {
        setTokenValid(false);
        setError('El enlace de restablecimiento es inválido o ha expirado. Por favor, solicita uno nuevo.');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
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
    setError('');

    if (!token) {
      setError('Token no válido.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const validationError = validatePassword(formData.newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await passwordResetService.resetPassword({
        token,
        newPassword: formData.newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al restablecer la contraseña.');
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

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando enlace de restablecimiento...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Enlace inválido
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6">
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Solicitar un nuevo enlace
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-sm text-blue-600 hover:text-blue-500 mb-6"
          >
            <ArrowLeft size={16} className="mr-1" />
            Volver al inicio de sesión
          </button>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">🔒</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Nueva contraseña
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Crea una nueva contraseña para tu cuenta.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-lg shadow-md space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                <CheckCircle size={20} />
                <div>
                  <p className="font-medium">¡Contraseña restablecida exitosamente!</p>
                  <p className="text-sm">Serás redirigido al inicio de sesión en unos segundos...</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>
              <div className="relative mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar nueva contraseña
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
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

            <button
              type="submit"
              disabled={loading || success || formData.newPassword !== formData.confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Restableciendo...' : success ? '¡Listo!' : 'Restablecer contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;