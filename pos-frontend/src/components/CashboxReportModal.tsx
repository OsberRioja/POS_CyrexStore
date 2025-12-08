import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, TrendingUp, TrendingDown, FileText, Download } from 'lucide-react';
import { useCurrency } from '../context/currencyContext';
import { reportService } from '../services/reportService';
import { useBulkCostConverter } from '../hooks/useBulkCostConverter';


interface CashboxReportModalProps {
  cashbox: any;
  onClose: () => void;
}
interface BulkConversionItem {
  id: string;
  costPrice: number;
  priceCurrency: string;
  itemData?: {
    originalPrice?: number;
    originalCurrency?: string;
    conversionRate?: number;
  };
}


// Definir interfaces para los tipos
interface CashCount {
  denominations?: { [key: string]: number };
  total?: number;
  expectedTotal?: number;
  difference?: number;
  timestamp?: string;
}

const CashboxReportModal: React.FC<CashboxReportModalProps> = ({ cashbox, onClose }) => {
  const { formatCurrency } = useCurrency();
  const [downloading, setDownloading] = useState(false); // Estado para descarga
  const [profitData, setProfitData] = useState<any>(null);

  // Determinar el estado del cuadre
  const getStatusInfo = () => {
    const difference = cashbox.difference || 0;
    
    if (difference === 0) {
      return {
        type: 'exact',
        icon: CheckCircle,
        color: 'green',
        title: 'Cuadre Exacto',
        message: 'El efectivo contado coincide exactamente con lo esperado',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800'
      };
    } else if (difference > 0) {
      return {
        type: 'surplus',
        icon: TrendingUp,
        color: 'orange',
        title: 'Excedente',
        message: `Hay más efectivo del esperado: ${formatCurrency(difference)}`,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800'
      };
    } else {
      return {
        type: 'shortage',
        icon: TrendingDown,
        color: 'red',
        title: 'Faltante',
        message: `Falta efectivo en caja: ${formatCurrency(Math.abs(difference))}`,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      };
    }
  };

  // Calcular ventas por método de pago con nombres reales
  const calcularVentasPorMetodo = () => {
    const ventasPorMetodo = new Map();
    
    cashbox.sales?.forEach((sale: any) => {
      sale.payments?.forEach((payment: any) => {
        const methodName = payment.paymentMethod?.name || 'Sin método';
        const current = ventasPorMetodo.get(methodName) || 0;
        ventasPorMetodo.set(methodName, current + payment.amount);
      });
    });
    
    return Array.from(ventasPorMetodo.entries()).map(([metodo, monto]) => ({
      metodo,
      monto
    }));
  };

  // Calcular gastos por método de pago con nombres reales
  const calcularGastosPorMetodo = () => {
    const gastosPorMetodo = new Map();
    
    cashbox.expenses?.forEach((expense: any) => {
      const methodName = expense.paymentMethod?.name || 'Sin método';
      const current = gastosPorMetodo.get(methodName) || 0;
      gastosPorMetodo.set(methodName, current + expense.amount);
    });
    
    return Array.from(gastosPorMetodo.entries()).map(([metodo, monto]) => ({
      metodo,
      monto
    }));
  };

  // Preparar datos para conversión masiva
  const conversionItems = useMemo(() => {
    const items: BulkConversionItem[] = [];
    
    cashbox.sales?.forEach((sale: any, saleIndex: number) => {
      sale.items?.forEach((item: any, itemIndex: number) => {
        const uniqueId = `${sale.id}-${itemIndex}`;
        items.push({
          id: uniqueId,
          costPrice: item.product?.costPrice || 0,
          priceCurrency: item.product?.priceCurrency || 'BOB',
          itemData: {
            originalPrice: item.originalPrice,
            originalCurrency: item.originalCurrency,
            conversionRate: item.conversionRate
          }
        });
      });
    });

    return items;
  }, [cashbox]);

  const { convertedItems, loading: converting } = useBulkCostConverter(conversionItems);

  // Calcular ganancias cuando los costos convertidos estén listos
  useEffect(() => {
    if (!converting && Object.keys(convertedItems).length > 0) {
      calcularGanancias();
    }
  }, [converting, convertedItems]);

  const calcularGanancias = () => {
    let gananciaBruta = 0;
    let ventasTotales = 0;
    let costosTotales = 0;
    let itemIndex = 0;

    cashbox.sales?.forEach((sale: any) => {
      sale.items?.forEach((item: any) => {
        const cantidad = item.quantity || 1;
        const precioVenta = item.unitPrice || 0;
        const uniqueId = `${sale.id}-${itemIndex}`;
        
        // Obtener costo convertido
        const costoEnBOB = convertedItems[uniqueId] || item.product?.costPrice || 0;

        ventasTotales += precioVenta * cantidad;
        costosTotales += costoEnBOB * cantidad;
        gananciaBruta += (precioVenta - costoEnBOB) * cantidad;
        
        itemIndex++;
      });
    });
    const totalGastos = cashbox.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
    
    setProfitData({
      gananciaBruta,
      ventasTotales,
      costosTotales,
      totalGastos,
      gananciaNeta: gananciaBruta - totalGastos,
      margenGanancia: ventasTotales > 0 ? (gananciaBruta / ventasTotales) * 100 : 0
    });
    console.log("Datos completos de caja:", cashbox);
    console.log("Items de la primera venta:", cashbox.sales?.[0]?.items?.[0]);
  };

  // Si necesitas un cálculo simple mientras se convierte
  // const calcularGananciasSimple = () => {
  //   let gananciaBruta = 0;
  //   let ventasTotales = 0;
  //   let costosTotales = 0;

  //   cashbox.sales?.forEach((sale: any) => {
  //     sale.items?.forEach((item: any) => {
  //       const cantidad = item.quantity || 1;
  //       const precioVenta = item.unitPrice || 0;
  //       const costoProducto = item.product?.costPrice || 0;
  //       const monedaCosto = item.product?.priceCurrency || 'BOB';
        
  //       let costoEnBOB = costoProducto;
        
  //       // Conversión básica mientras se cargan las tasas
  //       if (monedaCosto === 'USD') {
  //         costoEnBOB = costoProducto * 6.91;
  //       } else if (monedaCosto === 'CNY') {
  //         costoEnBOB = costoProducto * 0.95;
  //       }

  //       ventasTotales += precioVenta * cantidad;
  //       costosTotales += costoEnBOB * cantidad;
  //       gananciaBruta += (precioVenta - costoEnBOB) * cantidad;
  //     });
  //   });

  //   const totalGastos = cashbox.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
    
  //   return {
  //     gananciaBruta,
  //     ventasTotales,
  //     costosTotales,
  //     totalGastos,
  //     gananciaNeta: gananciaBruta - totalGastos,
  //     margenGanancia: ventasTotales > 0 ? (gananciaBruta / ventasTotales) * 100 : 0
  //   };
  // };


  // Calcular ganancias por producto
  // const calcularGananciasProductos = () => {
  //   let gananciaBruta = 0;
  //   let ventasTotales = 0;
  //   let costosTotales = 0;
    
  //   cashbox.sales?.forEach((sale: any) => {
  //     sale.items?.forEach((item: any) => {
  //       const cantidad = item.quantity || 1;
  //       const precioVenta = item.unitPrice || 0; // Ya está en BOB
        
  //       // Obtener el costo del producto en su moneda original
  //       const costoProductoOriginal = item.product?.costPrice || 0;
  //       const monedaCosto = item.product?.priceCurrency || 'BOB';
        
  //       let costoProductoEnBOB = costoProductoOriginal;
        
  //       // Si la moneda del costo es USD, convertir a BOB usando la tasa guardada
  //       if (monedaCosto === 'USD') {
  //         // Usar la tasa de cambio guardada en el item de venta
  //         const tasa = item.conversionRate || 1;
  //         costoProductoEnBOB = costoProductoOriginal * tasa;
  //       }
      
  //       ventasTotales += precioVenta * cantidad;
  //       costosTotales += costoProductoEnBOB * cantidad;
  //       gananciaBruta += (precioVenta - costoProductoEnBOB) * cantidad;
  //     });
  //   });
  
  //   return {
  //     gananciaBruta,
  //     ventasTotales,
  //     costosTotales,
  //     margenGanancia: ventasTotales > 0 ? (gananciaBruta / ventasTotales) * 100 : 0
  //   };
  // };

  // // Función para calcular ganancia neta (ya usa la función corregida)
  // const calcularGananciaNeta = () => {
  //   const { gananciaBruta } = calcularGananciasProductos();
  //   const totalGastos = cashbox.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;

  //   return gananciaBruta - totalGastos;
  // };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  const ventasPorMetodo = calcularVentasPorMetodo();
  const gastosPorMetodo = calcularGastosPorMetodo();

  // Calcular totales si no están disponibles
  const totalVentas = cashbox.sales?.reduce((sum: number, sale: any) => sum + sale.total, 0) || 0;
  const totalGastos = cashbox.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
  
  // Función para descargar reporte
  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await reportService.downloadDailyReport(cashbox.id);
      // Éxito silencioso - el archivo se descarga automáticamente
    } catch (error: any) {
      console.error("Error descargando reporte diario:", error);
      alert(error.message || "Error al descargar el reporte diario");
    } finally {
      setDownloading(false);
    }
  };

  // Tipo seguro para cashCount
  const cashCount = cashbox.cashCount as CashCount | null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Reporte de Cierre - Caja #{cashbox.id}</h2>
              <p className="text-sm text-gray-600">Detalles completos del cierre de caja</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón de descarga */}
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={16} />
              {downloading ? "Generando Excel..." : "Descargar Reporte"}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Estado del Cuadre */}
          <div className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            <div className="flex items-center gap-3">
              <StatusIcon size={24} className={statusInfo.textColor} />
              <div>
                <h3 className={`font-bold text-lg ${statusInfo.textColor}`}>{statusInfo.title}</h3>
                <p className={statusInfo.textColor}>{statusInfo.message}</p>
              </div>
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-800">📅 Información General</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Caja ID:</span>
                  <span className="font-medium">#{cashbox.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    cashbox.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {cashbox.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Abierta:</span>
                  <span className="font-medium">{new Date(cashbox.openedAt).toLocaleString('es-BO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cerrada:</span>
                  <span className="font-medium">
                    {cashbox.closedAt ? new Date(cashbox.closedAt).toLocaleString('es-BO') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Abierta por:</span>
                  <span className="font-medium">
                    {cashbox.openedByUser?.name}
                    {cashbox.openedByUser?.userCode && ` (#${cashbox.openedByUser.userCode})`}
                  </span>
                </div>
                {cashbox.closedByUser && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cerrada por:</span>
                    <span className="font-medium">
                      {cashbox.closedByUser.name}
                      {cashbox.closedByUser.userCode && ` (#${cashbox.closedByUser.userCode})`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen Financiero */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-800">💰 Resumen Financiero</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Inicial:</span>
                  <span className="font-medium">{formatCurrency(cashbox.initialAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Esperado:</span>
                  <span className="font-medium">
                    {formatCurrency(cashbox.expectedAmount || cashbox.closedAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Real:</span>
                  <span className="font-medium text-lg font-semibold">
                    {formatCurrency(cashbox.realClosedAmount || cashbox.closedAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Diferencia:</span>
                  <span className={`font-semibold ${
                    cashbox.difference === 0 ? 'text-green-600' :
                    cashbox.difference > 0 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {cashbox.difference > 0 ? '+' : ''}{formatCurrency(cashbox.difference || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalle de Movimientos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ventas */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-3 text-green-800">🛒 Ventas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Total Ventas:</span>
                  <span className="font-medium">{formatCurrency(totalVentas)}</span>
                </div>
                
                {/* 🔥 MEJORA: Desglose por métodos de pago reales */}
                {ventasPorMetodo.map(({ metodo, monto }) => (
                  <div key={metodo} className="flex justify-between">
                    <span className="text-green-700">Ventas - {metodo}:</span>
                    <span className="font-medium">{formatCurrency(monto)}</span>
                  </div>
                ))}
                
                <div className="flex justify-between border-t pt-2">
                  <span className="text-green-700">Cantidad de Ventas:</span>
                  <span className="font-medium">{cashbox.sales?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Gastos */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold mb-3 text-red-800">💸 Gastos</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-700">Total Gastos:</span>
                  <span className="font-medium">{formatCurrency(totalGastos)}</span>
                </div>
                
                {/* 🔥 MEJORA: Desglose por métodos de pago reales */}
                {gastosPorMetodo.map(({ metodo, monto }) => (
                  <div key={metodo} className="flex justify-between">
                    <span className="text-red-700">Gastos - {metodo}:</span>
                    <span className="font-medium">{formatCurrency(monto)}</span>
                  </div>
                ))}
                
                <div className="flex justify-between border-t pt-2">
                  <span className="text-red-700">Cantidad de Gastos:</span>
                  <span className="font-medium">{cashbox.expenses?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance del Día */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3 text-blue-800">⚖️ Balance del Día</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Total Ventas:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalVentas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Gastos:</span>
                <span className="font-medium text-red-600">{formatCurrency(totalGastos)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-blue-700 font-semibold">Balance (Ventas - Gastos):</span>
                <span className={`font-bold text-lg ${
                  (totalVentas - totalGastos) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(totalVentas - totalGastos)}
                </span>
              </div>
            </div>
          </div>

          {/* Nueva sección: Ganancias Netas */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold mb-3 text-purple-800">📊 Ganancias Netas</h3>

            {converting ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-sm text-gray-600">Calculando costos convertidos...</p>
              </div>
            ) : profitData ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Ventas Totales:</span>
                  <span className="font-medium">{formatCurrency(profitData.ventasTotales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Costos Totales:</span>
                  <span className="font-medium text-orange-600">{formatCurrency(profitData.costosTotales)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-purple-700 font-semibold">Ganancia Bruta (Ventas - Costos):</span>
                  <span className={`font-semibold ${
                    profitData.gananciaBruta >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(profitData.gananciaBruta)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Margen de Ganancia:</span>
                  <span className={`font-semibold ${
                    profitData.margenGanancia >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profitData.margenGanancia.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Gastos Totales:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(profitData.totalGastos)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-purple-700 font-bold text-base">GANANCIA NETA:</span>
                  <span className={`font-bold text-lg ${
                    profitData.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profitData.gananciaNeta >= 0 ? '+' : ''}{formatCurrency(profitData.gananciaNeta)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-red-500">No se pudieron calcular las ganancias</div>
            )}
          </div>

          {/* Observaciones */}
          {cashbox.observations && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-2 text-yellow-800">📝 Observaciones</h3>
              <p className="text-sm text-yellow-700 whitespace-pre-wrap">{cashbox.observations}</p>
            </div>
          )}

          {/* Desglose de Efectivo (si existe) */}
          {cashCount && cashCount.denominations && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3 text-blue-800">🧮 Desglose de Efectivo</h3>
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-blue-700">Total Contado:</span>
                  <span className="font-medium">{formatCurrency(cashCount.total || 0)}</span>
                </div>
                
                {cashCount.denominations && (
                  <div className="mt-3">
                    <h4 className="font-medium text-blue-700 mb-2">Denominaciones:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(cashCount.denominations)
                        .filter(([_, count]) => {
                          const countNum = Number(count);
                          return !isNaN(countNum) && countNum > 0;
                        })
                        .map(([denomination, count]) => {
                          const countNum = Number(count);
                          return (
                            <div key={denomination} className="bg-white p-2 rounded border text-xs">
                              <span className="font-medium">Bs. {denomination}:</span> {countNum} un.
                            </div>
                          );
                        })
                      }
                    </div>
                    {Object.entries(cashCount.denominations).filter(([_, count]) => {
                      const countNum = Number(count);
                      return !isNaN(countNum) && countNum > 0;
                    }).length === 0 && (
                      <p className="text-blue-600 text-center py-2">No se registraron denominaciones</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashboxReportModal;