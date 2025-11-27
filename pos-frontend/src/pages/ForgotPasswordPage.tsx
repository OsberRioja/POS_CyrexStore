import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { passwordResetService } from '../services/passwordResetService';

interface ForgotPasswordPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await passwordResetService.requestReset(email);
      setMessage('Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.');
      
      // Opcional: Redirigir después de un tiempo
      setTimeout(() => {
        onSuccess();
      }, 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al solicitar el restablecimiento de contraseña.');
    } finally {
      setLoading(false);
    }
  };

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
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Restablecer contraseña
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
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

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                <CheckCircle size={20} />
                <span>{message}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="usuario@ejemplo.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-gray-500">
          <p>El enlace de restablecimiento expirará en 1 hora por seguridad.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;