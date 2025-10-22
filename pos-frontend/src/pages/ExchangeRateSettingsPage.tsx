import { useAuth } from '../context/authContext';
import ExchangeRateManager from '../components/ExchangeRateManager';

export default function ExchangeRateSettingsPage() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            ⚠️ Solo administradores pueden acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ExchangeRateManager />
    </div>
  );
}