import { AlertTriangle, Box, Check, Eye, Trash2 } from 'lucide-react';
import type { SystemAlert } from '../types/systemAlert';

interface SystemAlertsPanelProps {
  alerts: SystemAlert[];
  total: number;
  loading: boolean;
  error: string | null;
  onViewCashbox: (alert: SystemAlert) => void;
  onMarkAsRead: (alertId: number) => void;
  onDismiss: (alertId: number) => void;
  onRefresh: () => void;
}

function formatAlertDate(value: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export default function SystemAlertsPanel({
  alerts,
  total,
  loading,
  error,
  onViewCashbox,
  onMarkAsRead,
  onDismiss,
  onRefresh,
}: SystemAlertsPanelProps) {
  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  return (
    <section className="bg-white rounded-lg shadow-md p-6 border border-amber-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-800">Alertas recientes del sistema</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount} no leídas de {total} alertas registradas
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="self-start md:self-auto px-3 py-2 text-sm font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
        >
          Actualizar alertas
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Cargando alertas...</div>
      ) : alerts.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No hay alertas pendientes o recientes.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <article
                key={alert.id}
                onDoubleClick={() => onViewCashbox(alert)}
                className={`p-4 transition cursor-pointer ${
                  alert.isRead ? 'bg-white hover:bg-gray-50' : 'bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex gap-3 min-w-0">
                    <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center ${
                      alert.isRead ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Box className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          alert.isRead ? 'bg-gray-100 text-gray-600' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {alert.isRead ? 'Leída' : 'No leída'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{alert.message}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Usuario: {alert.user?.name ?? alert.createdBy ?? 'N/D'}</span>
                        <span>Sucursal: {alert.branch?.name ?? 'N/D'}</span>
                        <span>Caja: #{alert.referenceId ?? 'N/D'}</span>
                        <span>{formatAlertDate(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => onViewCashbox(alert)}
                      disabled={!alert.referenceId}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye className="h-4 w-4" />
                      Ver caja
                    </button>
                    {!alert.isRead && (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead(alert.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-sm hover:bg-green-200"
                      >
                        <Check className="h-4 w-4" />
                        Marcar leída
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDismiss(alert.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Descartar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
