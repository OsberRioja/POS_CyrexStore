import { useState, useEffect } from 'react';
import { CommissionConfigService } from '../services/commissionConfigService';
import type { CommissionConfig, CreateCommissionConfigDTO, CommissionRange } from '../types/commission';
import { useDialog } from '../context/DialogContext';

export default function CommissionConfigPage() {
  const { confirm } = useDialog();
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null);
  const [formData, setFormData] = useState<CreateCommissionConfigDTO>({
    type: 'FIXED_AMOUNT',
    isActive: false,
    fixedAmount: null,
    percentage: null,
    ranges: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const allConfigs = await CommissionConfigService.getAll();
      setConfigs(allConfigs);
    } catch (error: any) {
      setError('Error al cargar configuraciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingConfig) {
        await CommissionConfigService.update(editingConfig.id, formData);
        setSuccess('Configuración actualizada correctamente');
      } else {
        await CommissionConfigService.create(formData);
        setSuccess('Configuración creada correctamente');
      }
      resetForm();
      loadConfigs();
    } catch (error: any) {
      setError('Error al guardar: ' + error.message);
    }
  };

  const handleEdit = (config: CommissionConfig) => {
    setEditingConfig(config);
    setFormData({
      type: config.type,
      isActive: config.isActive,
      fixedAmount: config.fixedAmount,
      percentage: config.percentage,
      ranges: config.ranges.map(range => ({
        minAmount: range.minAmount,
        maxAmount: range.maxAmount,
        commissionValue: range.commissionValue,
        commissionType: range.commissionType,
      })),
    });
  };

  const handleActivate = async (id: string) => {
    try {
      await CommissionConfigService.activate(id);
      setSuccess('Configuración activada correctamente');
      loadConfigs();
    } catch (error: any) {
      setError('Error al activar: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar configuración',
      message: '¿Estás seguro de eliminar esta configuración?',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!isConfirmed) return;
    try {
      await CommissionConfigService.delete(id);
      setSuccess('Configuración eliminada correctamente');
      loadConfigs();
    } catch (error: any) {
      setError('Error al eliminar: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'FIXED_AMOUNT',
      isActive: false,
      fixedAmount: null,
      percentage: null,
      ranges: [],
    });
    setEditingConfig(null);
  };

  const addRange = () => {
    setFormData(prev => ({
      ...prev,
      ranges: [...(prev.ranges ?? []), { minAmount: 0, maxAmount: null, commissionValue: 0, commissionType: 'FIXED' }],
    }));
  };

  const updateRange = (index: number, field: keyof CommissionRange, value: any) => {
    setFormData(prev => ({
      ...prev,
      ranges: (prev.ranges ?? []).map((range, i) => i === index ? { ...range, [field]: value } : range),
    }));
  };

  const removeRange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ranges: (prev.ranges ?? []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Configuración de Comisiones</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">
            {editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Tipo de comisión */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Comisión</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="FIXED_AMOUNT">Monto Fijo</option>
                  <option value="PERCENTAGE">Porcentaje</option>
                  <option value="TIERED_RANGES">Rangos Escalonados</option>
                </select>
              </div>

              {/* Monto fijo (solo para FIXED_AMOUNT) */}
              {formData.type === 'FIXED_AMOUNT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto Fijo (Bs)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fixedAmount || ''}
                    onChange={e => setFormData(prev => ({ ...prev, fixedAmount: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {/* Porcentaje (solo para PERCENTAGE) */}
              {formData.type === 'PERCENTAGE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Porcentaje (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.percentage || ''}
                    onChange={e => setFormData(prev => ({ ...prev, percentage: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {/* Rangos (solo para TIERED_RANGES) */}
              {formData.type === 'TIERED_RANGES' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Rangos de Comisión</label>
                    <button
                      type="button"
                      onClick={addRange}
                      className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      + Agregar Rango
                    </button>
                  </div>
                  {(formData.ranges ?? []).map((range, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Mínimo"
                        value={range.minAmount}
                        onChange={e => updateRange(index, 'minAmount', parseFloat(e.target.value))}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Máximo (dejar vacío para infinito)"
                        value={range.maxAmount || ''}
                        onChange={e => updateRange(index, 'maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <select
                        value={range.commissionType}
                        onChange={e => updateRange(index, 'commissionType', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="FIXED">Bs</option>
                        <option value="PERCENTAGE">%</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Valor"
                        value={range.commissionValue}
                        onChange={e => updateRange(index, 'commissionValue', parseFloat(e.target.value))}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeRange(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Activar al guardar */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Activar esta configuración al guardar
                </label>
              </div>

              {/* Botones */}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingConfig ? 'Actualizar' : 'Crear'} Configuración
                </button>
                {editingConfig && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Lista de configuraciones */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">Configuraciones Existentes</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="space-y-4">
              {configs.map(config => (
                <div
                  key={config.id}
                  className={`p-4 border rounded-lg ${
                    config.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {config.type === 'FIXED_AMOUNT' && `Monto Fijo: ${config.fixedAmount} Bs`}
                        {config.type === 'PERCENTAGE' && `Porcentaje: ${config.percentage}%`}
                        {config.type === 'TIERED_RANGES' && `Rangos Escalonados (${config.ranges.length} rangos)`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Creado por: {config.user?.name} ({config.user?.userCode})
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(config.createdAt).toLocaleDateString()}
                      </p>
                      {config.isActive && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Activa
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {!config.isActive && (
                        <>
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleActivate(config.id)}
                            className="text-green-500 hover:text-green-700"
                          >
                            Activar
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {config.type === 'TIERED_RANGES' && (
                    <div className="mt-2 text-sm">
                      {config.ranges.map((range, index) => (
                        <div key={index} className="flex space-x-1">
                          <span>
                            {range.minAmount} - {range.maxAmount ?? '∞'} Bs:
                          </span>
                          <span>
                            {range.commissionValue} {range.commissionType === 'FIXED' ? 'Bs' : '%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
