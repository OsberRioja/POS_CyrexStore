import ExcelJS from 'exceljs';
import { prisma } from '../prismaClient';
import { PaymentStatus } from '@prisma/client'; // Importar el enum
import { MonthlyReportFilters, PeriodReportFilters } from '../dtos/report.dto';

export const reportService = {
  async generateSalesReport(cashBoxId: number) {
    // Verificar que la caja existe y está cerrada
    const cashBox = await prisma.cashBox.findUnique({
      where: { id: cashBoxId },
      include: {
        sales: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                    costPrice: true,
                    priceCurrency: true
                  }
                }
              }
            },
            payments: {
              include: {
                paymentMethod: true
              }
            },
            client: true,
            seller: {
              select: {
                name: true,
                userCode: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!cashBox) {
      throw { status: 404, message: 'Caja no encontrada' };
    }

    if (cashBox.status !== 'CLOSED') {
      throw { status: 400, message: 'Solo se pueden generar reportes de cajas cerradas' };
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS';
    workbook.created = new Date();

    // Hoja de ventas
    const salesSheet = workbook.addWorksheet('VENTAS');

    // Estilos
    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2E86AB' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    // Mapeo completo de estados de pago
    const paymentStatusMap: Record<PaymentStatus, string> = {
      PENDING: 'PENDIENTE',
      PARTIAL: 'PARCIAL', 
      PAID: 'PAGADO',
      OVERPAID: 'SOBREPAGADO'
    };

    // Encabezados
    salesSheet.columns = [
      { header: 'ID Venta', key: 'id', width: 15 },
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Cliente', key: 'client', width: 25 },
      { header: 'Vendedor', key: 'seller', width: 20 },
      { header: 'Productos', key: 'products', width: 40 },
      { header: 'Cantidad Total', key: 'totalQuantity', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Pagado', key: 'paid', width: 15 },
      { header: 'Saldo', key: 'balance', width: 15 },
      { header: 'Métodos de Pago', key: 'paymentMethods', width: 30 },
      { header: 'Estado', key: 'status', width: 15 }
    ];

    // Aplicar estilo a los encabezados
    const headerRow = salesSheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    // Datos de ventas
    let rowNumber = 2;
    let totalSales = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    cashBox.sales.forEach((sale) => {
      const products = sale.items.map(item => 
        `${item.product.name} (x${item.quantity})`
      ).join(', ');

      const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      
      const paymentMethods = sale.payments.map(payment => 
        `${payment.paymentMethod.name}: Bs. ${payment.amount.toFixed(2)}`
      ).join('\n');

      // Calcular total pagado
      const paidAmount = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = sale.total - paidAmount;

      // Lógica para determinar el estado
      let displayStatus = paymentStatusMap[sale.paymentStatus];

      // Casos especiales que requieren lógica adicional
      if (sale.paymentStatus === 'PENDING' && paidAmount === 0) {
        displayStatus = 'PENDIENTE';
      } else if (sale.paymentStatus === 'PENDING' && paidAmount > 0) {
        displayStatus = 'PARCIAL';
      } else if (sale.paymentStatus === 'OVERPAID') {
        displayStatus = 'SOBREPAGADO';
      }

      salesSheet.addRow({
        id: sale.id.substring(0, 8),
        date: sale.createdAt.toLocaleString('es-BO'),
        client: sale.client?.nombre || 'N/A',
        seller: `${sale.seller.name} (${sale.seller.userCode})`,
        products: products,
        totalQuantity: totalQuantity,
        subtotal: `Bs. ${sale.total.toFixed(2)}`,
        total: `Bs. ${sale.total.toFixed(2)}`,
        paid: `Bs. ${paidAmount.toFixed(2)}`,
        balance: `Bs. ${balance.toFixed(2)}`,
        paymentMethods: paymentMethods,
        status: displayStatus
      });

      // Aplicar color al estado según la situación
      const statusCell = salesSheet.getCell(`L${rowNumber}`);
      
      // 🔥 CORRECCIÓN: Switch statement más claro
      switch (displayStatus) {
        case 'PENDIENTE':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE0B2' } // Naranja claro
          };
          statusCell.font = { color: { argb: 'FFE65100' }, bold: true };
          break;
        case 'PARCIAL':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE1F5FE' } // Azul claro
          };
          statusCell.font = { color: { argb: 'FF01579B' }, bold: true };
          break;
        case 'PAGADO':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F5E8' } // Verde claro
          };
          statusCell.font = { color: { argb: 'FF1B5E20' }, bold: true };
          break;
        case 'SOBREPAGADO':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3E5F5' } // Púrpura claro
          };
          statusCell.font = { color: { argb: 'FF4A148C' }, bold: true };
          break;
        default:
          // Sin estilo especial para otros estados
          break;
      }

      // Aplicar bordes a toda la fila
      const row = salesSheet.getRow(rowNumber);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Acumular totales
      totalSales += sale.total;
      totalPaid += paidAmount;
      totalBalance += balance;

      rowNumber++;
    });

    // Agregar fila de totales (código sin cambios)
    const totalRow = salesSheet.addRow({});
    
    // Combinar celdas para el label "TOTAL GENERAL"
    salesSheet.mergeCells(`A${rowNumber}:E${rowNumber}`);
    const totalLabelCell = salesSheet.getCell(`A${rowNumber}`);
    totalLabelCell.value = 'TOTAL GENERAL';
    totalLabelCell.font = { bold: true, size: 12 };
    totalLabelCell.alignment = { horizontal: 'right' };
    totalLabelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };

    // Total ventas
    salesSheet.getCell(`F${rowNumber}`).value = `Bs. ${totalSales.toFixed(2)}`;
    salesSheet.getCell(`F${rowNumber}`).font = { bold: true };
    salesSheet.getCell(`F${rowNumber}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };

    // Total pagado
    salesSheet.getCell(`G${rowNumber}`).value = `Bs. ${totalPaid.toFixed(2)}`;
    salesSheet.getCell(`G${rowNumber}`).font = { bold: true };
    salesSheet.getCell(`G${rowNumber}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };

    // Total saldo
    salesSheet.getCell(`H${rowNumber}`).value = `Bs. ${totalBalance.toFixed(2)}`;
    salesSheet.getCell(`H${rowNumber}`).font = { bold: true };
    if (totalBalance > 0) {
      salesSheet.getCell(`H${rowNumber}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0B2' }
      };
    } else {
      salesSheet.getCell(`H${rowNumber}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F5E8' }
      };
    }

    // Aplicar bordes a la fila de totales
    const totalRowCells = salesSheet.getRow(rowNumber);
    totalRowCells.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Información de la caja
    const infoSheet = workbook.addWorksheet('INFORMACIÓN CAJA');
    
    infoSheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Valor', key: 'value', width: 30 }
    ];

    const infoHeader = infoSheet.getRow(1);
    infoHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    // Calcular resumen de estados con el enum completo
    const statusSummary = cashBox.sales.reduce((acc, sale) => {
      const paidAmount = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Usar la misma lógica que arriba para determinar el estado de display
      let displayStatus = paymentStatusMap[sale.paymentStatus];
      
      if (sale.paymentStatus === 'PENDING' && paidAmount === 0) {
        displayStatus = 'PENDIENTE';
      } else if (sale.paymentStatus === 'PENDING' && paidAmount > 0) {
        displayStatus = 'PARCIAL';
      } else if (sale.paymentStatus === 'OVERPAID') {
        displayStatus = 'SOBREPAGADO';
      }

      acc[displayStatus] = (acc[displayStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const infoData = [
      { field: 'ID Caja', value: cashBox.id },
      { field: 'Fecha Apertura', value: cashBox.openedAt.toLocaleString('es-BO') },
      { field: 'Fecha Cierre', value: cashBox.closedAt?.toLocaleString('es-BO') || 'N/A' },
      { field: 'Monto Inicial', value: `Bs. ${cashBox.initialAmount.toFixed(2)}` },
      { field: 'Monto Cierre', value: `Bs. ${cashBox.closedAmount?.toFixed(2) || 'N/A'}` },
      { field: 'Total Ventas', value: `Bs. ${totalSales.toFixed(2)}` },
      { field: 'Total Pagado', value: `Bs. ${totalPaid.toFixed(2)}` },
      { field: 'Saldo Pendiente', value: `Bs. ${totalBalance.toFixed(2)}` },
      { field: 'Cantidad de Ventas', value: cashBox.sales.length },
      { field: 'Ventas Pagadas', value: statusSummary['PAGADO'] || 0 },
      { field: 'Ventas Parciales', value: statusSummary['PARCIAL'] || 0 },
      { field: 'Ventas Pendientes', value: statusSummary['PENDIENTE'] || 0 },
      { field: 'Ventas Sobre pagadas', value: statusSummary['SOBREPAGADO'] || 0 },
      { field: 'Estado Caja', value: cashBox.status }
    ];

    infoData.forEach((item, index) => {
      const row = infoSheet.addRow(item);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  async generateExpensesReport(cashBoxId: number) {
    // Verificar que la caja existe y está cerrada
    const cashBox = await prisma.cashBox.findUnique({
      where: { id: cashBoxId },
      include: {
        expenses: {
          include: {
            paymentMethod: true,
            user: {
              select: {
                name: true,
                userCode: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  
    if (!cashBox) {
      throw { status: 404, message: 'Caja no encontrada' };
    }
  
    if (cashBox.status !== 'CLOSED') {
      throw { status: 400, message: 'Solo se pueden generar reportes de cajas cerradas' };
    }
  
    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS';
    workbook.created = new Date();
  
    // Hoja de gastos
    const expensesSheet = workbook.addWorksheet('GASTOS');
  
    // Estilos
    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2E86AB' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };
  
    // Encabezados
    expensesSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Concepto', key: 'concept', width: 30 },
      { header: 'Método de Pago', key: 'paymentMethod', width: 20 },
      { header: 'Monto', key: 'amount', width: 15 },
      { header: 'Registrado por', key: 'user', width: 25 },
      { header: 'Notas', key: 'notes', width: 40 }
    ];
  
    // Aplicar estilo a los encabezados
    const headerRow = expensesSheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });
  
    // Datos de gastos
    let rowNumber = 2;
    let totalExpenses = 0;
  
    cashBox.expenses.forEach((expense) => {
      expensesSheet.addRow({
        id: expense.id,
        date: expense.createdAt.toLocaleString('es-BO'),
        concept: expense.concept,
        paymentMethod: expense.paymentMethod.name,
        amount: `Bs. ${expense.amount.toFixed(2)}`,
        user: expense.user ? `${expense.user.name} (${expense.user.userCode})` : 'N/A',
        notes: (expense as any).notes || 'N/A'
      });
  
      // Aplicar bordes a la fila
      const row = expensesSheet.getRow(rowNumber);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
  
      totalExpenses += expense.amount;
      rowNumber++;
    });
  
    // Agregar fila de totales
    const totalRow = expensesSheet.addRow({});
    expensesSheet.mergeCells(`A${rowNumber}:D${rowNumber}`);
    
    const totalCell = expensesSheet.getCell(`A${rowNumber}`);
    totalCell.value = 'TOTAL GASTOS';
    totalCell.font = { bold: true };
    totalCell.alignment = { horizontal: 'right' };
  
    expensesSheet.getCell(`E${rowNumber}`).value = `Bs. ${totalExpenses.toFixed(2)}`;
    expensesSheet.getCell(`E${rowNumber}`).font = { bold: true };
    expensesSheet.getCell(`E${rowNumber}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE0E0' }
    };
  
    // Aplicar bordes a la fila de totales
    const totalRowCells = expensesSheet.getRow(rowNumber);
    totalRowCells.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  
    // Información de la caja (hoja adicional)
    const infoSheet = workbook.addWorksheet('INFORMACIÓN CAJA');
    
    infoSheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Valor', key: 'value', width: 30 }
    ];
  
    const infoHeader = infoSheet.getRow(1);
    infoHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });
  
    const infoData = [
      { field: 'ID Caja', value: cashBox.id },
      { field: 'Fecha Apertura', value: cashBox.openedAt.toLocaleString('es-BO') },
      { field: 'Fecha Cierre', value: cashBox.closedAt?.toLocaleString('es-BO') || 'N/A' },
      { field: 'Monto Inicial', value: `Bs. ${cashBox.initialAmount.toFixed(2)}` },
      { field: 'Monto Cierre', value: `Bs. ${cashBox.closedAmount?.toFixed(2) || 'N/A'}` },
      { field: 'Total Gastos', value: `Bs. ${totalExpenses.toFixed(2)}` },
      { field: 'Cantidad de Gastos', value: cashBox.expenses.length },
      { field: 'Estado', value: cashBox.status }
    ];
  
    infoData.forEach((item, index) => {
      const row = infoSheet.addRow(item);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  
    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  async generatePaymentMethodsReport(cashBoxId: number) {
    // Verificar que la caja existe y está cerrada
    const cashBox = await prisma.cashBox.findUnique({
      where: { id: cashBoxId }
    });

    if (!cashBox) {
      throw { status: 404, message: 'Caja no encontrada' };
    }

    if (cashBox.status !== 'CLOSED') {
      throw { status: 400, message: 'Solo se pueden generar reportes de cajas cerradas' };
    }

    // Obtener todos los métodos de pago y sus totales para esta caja
    const paymentMethodsSummary = await prisma.paymentMethod.findMany({
      include: {
        salePayments: {
          where: {
            sale: {
              cashBoxId: cashBoxId
            }
          },
          select: {
            amount: true
          }
        }
      }
    });

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS';
    workbook.created = new Date();

    // Hoja de métodos de pago
    const paymentMethodsSheet = workbook.addWorksheet('MÉTODOS DE PAGO');

    // Estilos
    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2E86AB' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    // Encabezados
    paymentMethodsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Método de Pago', key: 'name', width: 25 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Total Recaudado', key: 'total', width: 20 },
      { header: 'Cantidad de Transacciones', key: 'transactions', width: 25 },
      { header: 'Porcentaje del Total', key: 'percentage', width: 20 }
    ];

    // Aplicar estilo a los encabezados
    const headerRow = paymentMethodsSheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    // Calcular total general
    const totalGeneral = paymentMethodsSummary.reduce((sum, method) => {
      const methodTotal = method.salePayments.reduce((methodSum, payment) => 
        methodSum + payment.amount, 0
      );
      return sum + methodTotal;
    }, 0);

    // Datos de métodos de pago
    let rowNumber = 2;
    let grandTotal = 0;

    paymentMethodsSummary.forEach((method) => {
      const methodTotal = method.salePayments.reduce((sum, payment) => 
        sum + payment.amount, 0
      );
      const transactionCount = method.salePayments.length;
      const percentage = totalGeneral > 0 ? (methodTotal / totalGeneral) * 100 : 0;

      // Solo mostrar métodos que tengan transacciones o sean relevantes
      if (methodTotal > 0 || method.isCash) {
        paymentMethodsSheet.addRow({
          id: method.id,
          name: method.name,
          type: method.isCash ? 'Efectivo' : 'No Efectivo',
          total: `Bs. ${methodTotal.toFixed(2)}`,
          transactions: transactionCount,
          percentage: `${percentage.toFixed(2)}%`
        });

        // Aplicar bordes a la fila
        const row = paymentMethodsSheet.getRow(rowNumber);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Resaltar métodos de efectivo
        if (method.isCash) {
          const typeCell = paymentMethodsSheet.getCell(`C${rowNumber}`);
          typeCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F5E8' }
          };
          typeCell.font = { bold: true, color: { argb: 'FF1B5E20' } };
        }

        grandTotal += methodTotal;
        rowNumber++;
      }
    });

    // Agregar fila de totales
    const totalRow = paymentMethodsSheet.addRow({});
    paymentMethodsSheet.mergeCells(`A${rowNumber}:C${rowNumber}`);

    const totalCell = paymentMethodsSheet.getCell(`A${rowNumber}`);
    totalCell.value = 'TOTAL GENERAL';
    totalCell.font = { bold: true };
    totalCell.alignment = { horizontal: 'right' };

    paymentMethodsSheet.getCell(`D${rowNumber}`).value = `Bs. ${grandTotal.toFixed(2)}`;
    paymentMethodsSheet.getCell(`D${rowNumber}`).font = { bold: true };
    paymentMethodsSheet.getCell(`D${rowNumber}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };

    // Aplicar bordes a la fila de totales
    const totalRowCells = paymentMethodsSheet.getRow(rowNumber);
    totalRowCells.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Información de la caja (hoja adicional)
    const infoSheet = workbook.addWorksheet('INFORMACIÓN CAJA');

    infoSheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Valor', key: 'value', width: 30 }
    ];

    const infoHeader = infoSheet.getRow(1);
    infoHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    // Calcular estadísticas adicionales
    const totalTransactions = paymentMethodsSummary.reduce((sum, method) => 
      sum + method.salePayments.length, 0
    );

    const cashTotal = paymentMethodsSummary
      .filter(method => method.isCash)
      .reduce((sum, method) => 
        sum + method.salePayments.reduce((methodSum, payment) => 
          methodSum + payment.amount, 0
        ), 0
      );
    
    const nonCashTotal = paymentMethodsSummary
      .filter(method => !method.isCash)
      .reduce((sum, method) => 
        sum + method.salePayments.reduce((methodSum, payment) => 
          methodSum + payment.amount, 0
        ), 0
      );

    const infoData = [
      { field: 'ID Caja', value: cashBox.id },
      { field: 'Fecha Apertura', value: cashBox.openedAt.toLocaleString('es-BO') },
      { field: 'Fecha Cierre', value: cashBox.closedAt?.toLocaleString('es-BO') || 'N/A' },
      { field: 'Monto Inicial', value: `Bs. ${cashBox.initialAmount.toFixed(2)}` },
      { field: 'Monto Cierre', value: `Bs. ${cashBox.closedAmount?.toFixed(2) || 'N/A'}` },
      { field: 'Total Recaudado', value: `Bs. ${grandTotal.toFixed(2)}` },
      { field: 'Total Efectivo', value: `Bs. ${cashTotal.toFixed(2)}` },
      { field: 'Total No Efectivo', value: `Bs. ${nonCashTotal.toFixed(2)}` },
      { field: 'Cantidad de Métodos', value: paymentMethodsSummary.filter(m => 
        m.salePayments.reduce((sum, p) => sum + p.amount, 0) > 0
      ).length },
      { field: 'Total Transacciones', value: totalTransactions },
      { field: 'Estado', value: cashBox.status }
    ];

    infoData.forEach((item, index) => {
      const row = infoSheet.addRow(item);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  async generateDailyReport(cashBoxId: number) {
    // Verificar que la caja existe y está cerrada
    const cashBox = await prisma.cashBox.findUnique({
      where: { id: cashBoxId },
      include: {
        sales: {
          include: {
            payments: {
              include: {
                paymentMethod: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                    costPrice: true,
                    priceCurrency: true
                  }
                }
              },
              select: {
                id: true,
                quantity: true,
                unitPrice: true,
                subtotal: true,
                originalPrice: true,
                originalCurrency: true,
                conversionRate: true,
                product: true
              }
            }
          }
        },
        expenses: {
          include: {
            paymentMethod: true
          }
        },
        openedByUser: {
          select: {
            name: true,
            userCode: true
          }
        },
        closedByUser: {
          select: {
            name: true,
            userCode: true
          }
        }
      }
    });

    if (!cashBox) {
      throw { status: 404, message: 'Caja no encontrada' };
    }

    if (cashBox.status !== 'CLOSED') {
      throw { status: 400, message: 'Solo se pueden generar reportes de cajas cerradas' };
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS';
    workbook.created = new Date();

    // Estilos
    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2E86AB' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    const successStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFE8F5E8' }
      },
      font: {
        color: { argb: 'FF1B5E20' },
        bold: true
      }
    };

    const warningStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFFFE0B2' }
      },
      font: {
        color: { argb: 'FFE65100' },
        bold: true
      }
    };

    const dangerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFFFEBEE' }
      },
      font: {
        color: { argb: 'FFB71C1C' },
        bold: true
      }
    };

    // Hoja de Resumen General
    const summarySheet = workbook.addWorksheet('RESUMEN GENERAL');

    // Título principal
    summarySheet.mergeCells('A1:F1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `REPORTE DIARIO - CAJA #${cashBox.id}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E86AB' }
    };
    titleCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Información de la caja
    summarySheet.mergeCells('A3:F3');
    const infoTitleCell = summarySheet.getCell('A3');
    infoTitleCell.value = 'INFORMACIÓN DE LA CAJA';
    infoTitleCell.font = { bold: true, size: 12 };
    infoTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };

    const infoData = [
      ['ID Caja:', cashBox.id],
      ['Fecha Apertura:', cashBox.openedAt.toLocaleString('es-BO')],
      ['Fecha Cierre:', cashBox.closedAt?.toLocaleString('es-BO') || 'N/A'],
      ['Abierta por:', `${cashBox.openedByUser.name} (#${cashBox.openedByUser.userCode})`],
      ['Cerrada por:', cashBox.closedByUser ? `${cashBox.closedByUser.name} (#${cashBox.closedByUser.userCode})` : 'N/A'],
      ['Monto Inicial:', `Bs. ${cashBox.initialAmount.toFixed(2)}`],
      ['Monto Esperado:', `Bs. ${cashBox.closedAmount?.toFixed(2) || 'N/A'}`],
      ['Monto Real:', `Bs. ${cashBox.realClosedAmount || cashBox.closedAmount?.toFixed(2) || 'N/A'}`]
    ];

    infoData.forEach(([label, value], index) => {
      summarySheet.getCell(`A${index + 4}`).value = label;
      summarySheet.getCell(`B${index + 4}`).value = value;
    });

    // Estado del cuadre
    const difference = cashBox.difference || 0;
    let statusStyle = successStyle;
    let statusText = 'CUADRE EXACTO';

    if (difference > 0) {
      statusStyle = warningStyle;
      statusText = `EXCEDENTE: Bs. ${Math.abs(difference).toFixed(2)}`;
    } else if (difference < 0) {
      statusStyle = dangerStyle;
      statusText = `FALTANTE: Bs. ${Math.abs(difference).toFixed(2)}`;
    }

    summarySheet.mergeCells(`A12:F12`);
    const statusCell = summarySheet.getCell('A12');
    statusCell.value = statusText;
    statusCell.font = { bold: true, size: 14 };
    statusCell.alignment = { horizontal: 'center' };
    statusCell.fill = statusStyle.fill;
    statusCell.font = statusStyle.font;

    // Resumen Financiero
    summarySheet.mergeCells('A14:F14');
    const financialTitleCell = summarySheet.getCell('A14');
    financialTitleCell.value = 'RESUMEN FINANCIERO';
    financialTitleCell.font = { bold: true, size: 12 };
    financialTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };

    // Calcular totales
    const totalVentas = cashBox.sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalGastos = cashBox.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = totalVentas - totalGastos;

    // Ventas por método de pago (con nombres reales)
    const ventasPorMetodo = new Map();
    cashBox.sales.forEach(sale => {
      sale.payments.forEach(payment => {
        const methodName = payment.paymentMethod.name;
        const current = ventasPorMetodo.get(methodName) || 0;
        ventasPorMetodo.set(methodName, current + payment.amount);
      });
    });

    // Gastos por método de pago (con nombres reales)
    const gastosPorMetodo = new Map();
    cashBox.expenses.forEach(expense => {
      const methodName = expense.paymentMethod.name;
      const current = gastosPorMetodo.get(methodName) || 0;
      gastosPorMetodo.set(methodName, current + expense.amount);
    });

    const financialData = [
      ['CONCEPTO', 'MONTO'],
      ['VENTAS TOTALES', `Bs. ${totalVentas.toFixed(2)}`],
      ['GASTOS TOTALES', `Bs. ${totalGastos.toFixed(2)}`],
      ['BALANCE DEL DÍA', `Bs. ${balance.toFixed(2)}`]
    ];

    // Agregar métodos de pago de ventas
    ventasPorMetodo.forEach((monto, metodo) => {
      financialData.push([`VENTAS - ${metodo}`, `Bs. ${monto.toFixed(2)}`]);
    });

    // Agregar métodos de pago de gastos
    gastosPorMetodo.forEach((monto, metodo) => {
      financialData.push([`GASTOS - ${metodo}`, `Bs. ${monto.toFixed(2)}`]);
    });

    financialData.forEach(([concepto, monto], index) => {
      summarySheet.getCell(`A${index + 15}`).value = concepto;
      summarySheet.getCell(`B${index + 15}`).value = monto;
    });

    // Estadísticas
    const startRow = 15 + financialData.length + 2;
    summarySheet.mergeCells(`A${startRow}:F${startRow}`);
    const statsTitleCell = summarySheet.getCell(`A${startRow}`);
    statsTitleCell.value = 'ESTADÍSTICAS';
    statsTitleCell.font = { bold: true, size: 12 };
    statsTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };

    const statsData = [
      ['Cantidad de Ventas:', cashBox.sales.length],
      ['Cantidad de Gastos:', cashBox.expenses.length],
      ['Productos Vendidos:', cashBox.sales.reduce((sum, sale) => sum + sale.items.length, 0)],
      ['Unidades Vendidas:', cashBox.sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      )]
    ];

    statsData.forEach(([label, value], index) => {
      summarySheet.getCell(`A${startRow + index + 1}`).value = label;
      summarySheet.getCell(`B${startRow + index + 1}`).value = value;
    });

    // Aplicar bordes a todas las celdas con datos
    for (let i = 1; i <= startRow + statsData.length; i++) {
      const row = summarySheet.getRow(i);
      if (Array.isArray(row.values) && row.values.length > 0) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    }

    // Hoja de Detalle de Ventas
    const salesSheet = workbook.addWorksheet('DETALLE VENTAS');

    salesSheet.columns = [
      { header: 'ID Venta', key: 'id', width: 15 },
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Productos', key: 'products', width: 40 },
      { header: 'Cantidad', key: 'quantity', width: 12 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Métodos de Pago', key: 'paymentMethods', width: 30 }
    ];

    const salesHeader = salesSheet.getRow(1);
    salesHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    cashBox.sales.forEach((sale, index) => {
      const products = sale.items.map(item => 
        `${item.product.name} (x${item.quantity})`
      ).join(', ');

      const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);

      const paymentMethods = sale.payments.map(payment => 
        `${payment.paymentMethod.name}: Bs. ${payment.amount.toFixed(2)}`
      ).join('\n');

      salesSheet.addRow({
        id: sale.id.substring(0, 8),
        date: sale.createdAt.toLocaleString('es-BO'),
        products: products,
        quantity: totalQuantity,
        total: `Bs. ${sale.total.toFixed(2)}`,
        paymentMethods: paymentMethods
      });

      // Aplicar bordes
      const row = salesSheet.getRow(index + 2);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Hoja de Detalle de Gastos
    const expensesSheet = workbook.addWorksheet('DETALLE GASTOS');

    expensesSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Concepto', key: 'concept', width: 30 },
      { header: 'Método de Pago', key: 'paymentMethod', width: 20 },
      { header: 'Monto', key: 'amount', width: 15 }
    ];

    const expensesHeader = expensesSheet.getRow(1);
    expensesHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    cashBox.expenses.forEach((expense, index) => {
      expensesSheet.addRow({
        id: expense.id,
        date: expense.createdAt.toLocaleString('es-BO'),
        concept: expense.concept,
        paymentMethod: expense.paymentMethod.name,
        amount: `Bs. ${expense.amount.toFixed(2)}`
      });

      // Aplicar bordes
      const row = expensesSheet.getRow(index + 2);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },
  async generateMonthlySalesReport(filters: MonthlyReportFilters) {
    const { year, month, branchId } = filters;
    
    // Calcular fechas del mes
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Obtener ventas del mes
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...(branchId && { branchId })
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: {
          include: {
            paymentMethod: true
          }
        },
        client: true,
        seller: true,
        branch: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS';
    workbook.created = new Date();

    // Estilos
    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2E86AB' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    // Hoja de Resumen
    const summarySheet = workbook.addWorksheet('RESUMEN MENSUAL');

    // Título
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[month - 1];
    
    summarySheet.mergeCells('A1:F1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `REPORTE DE VENTAS MENSUAL - ${monthName.toUpperCase()} ${year}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = headerStyle.fill;
    titleCell.font = headerStyle.font;

    // Información del período
    summarySheet.mergeCells('A3:F3');
    const periodCell = summarySheet.getCell('A3');
    periodCell.value = `PERÍODO: ${startDate.toLocaleDateString('es-BO')} - ${endDate.toLocaleDateString('es-BO')}`;
    periodCell.font = { bold: true };
    periodCell.alignment = { horizontal: 'center' };

    // Calcular resumen
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPaid = sales.reduce((sum, sale) => 
      sum + sale.payments.reduce((paidSum, payment) => paidSum + payment.amount, 0), 0);
    const totalBalance = totalAmount - totalPaid;
    const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0;
    const totalItems = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    // Resumen General
    const summaryData = [
      ['TOTAL VENTAS:', totalSales],
      ['MONTO TOTAL VENTAS:', `Bs. ${totalAmount.toFixed(2)}`],
      ['TOTAL PAGADO:', `Bs. ${totalPaid.toFixed(2)}`],
      ['SALDO PENDIENTE:', `Bs. ${totalBalance.toFixed(2)}`],
      ['TICKET PROMEDIO:', `Bs. ${averageTicket.toFixed(2)}`],
      ['UNIDADES VENDIDAS:', totalItems]
    ];

    summaryData.forEach(([label, value], index) => {
      summarySheet.getCell(`A${index + 5}`).value = label;
      summarySheet.getCell(`B${index + 5}`).value = value;
      summarySheet.getCell(`A${index + 5}`).font = { bold: true };
    });

    // Resumen por Método de Pago
    const paymentMethodsMap = new Map();
    
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        const methodName = payment.paymentMethod.name;
        const current = paymentMethodsMap.get(methodName) || { amount: 0, count: 0 };
        current.amount += payment.amount;
        current.count += 1;
        paymentMethodsMap.set(methodName, current);
      });
    });

    let paymentRow = 12;
    summarySheet.getCell(`A${paymentRow}`).value = 'RESUMEN POR MÉTODO DE PAGO';
    summarySheet.getCell(`A${paymentRow}`).font = { bold: true, size: 12 };
    summarySheet.mergeCells(`A${paymentRow}:F${paymentRow}`);

    paymentRow++;
    paymentMethodsMap.forEach((data, methodName) => {
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;
      summarySheet.getCell(`A${paymentRow}`).value = methodName;
      summarySheet.getCell(`B${paymentRow}`).value = `Bs. ${data.amount.toFixed(2)}`;
      summarySheet.getCell(`C${paymentRow}`).value = `${percentage.toFixed(2)}%`;
      summarySheet.getCell(`D${paymentRow}`).value = data.count;
      paymentRow++;
    });

    // Resumen por Vendedor
    const sellersMap = new Map();
    
    sales.forEach(sale => {
      const sellerId = sale.sellerId;
      const sellerName = sale.seller.name;
      const current = sellersMap.get(sellerId) || { name: sellerName, count: 0, amount: 0 };
      current.count += 1;
      current.amount += sale.total;
      sellersMap.set(sellerId, current);
    });

    let sellerRow = paymentRow + 2;
    summarySheet.getCell(`A${sellerRow}`).value = 'RESUMEN POR VENDEDOR';
    summarySheet.getCell(`A${sellerRow}`).font = { bold: true, size: 12 };
    summarySheet.mergeCells(`A${sellerRow}:F${sellerRow}`);

    sellerRow++;
    sellersMap.forEach((data, sellerId) => {
      const average = data.count > 0 ? data.amount / data.count : 0;
      summarySheet.getCell(`A${sellerRow}`).value = data.name;
      summarySheet.getCell(`B${sellerRow}`).value = data.count;
      summarySheet.getCell(`C${sellerRow}`).value = `Bs. ${data.amount.toFixed(2)}`;
      summarySheet.getCell(`D${sellerRow}`).value = `Bs. ${average.toFixed(2)}`;
      sellerRow++;
    });

    // Hoja de Detalle de Ventas
    const salesSheet = workbook.addWorksheet('DETALLE VENTAS');

    salesSheet.columns = [
      { header: 'FECHA', key: 'date', width: 20 },
      { header: 'ID VENTA', key: 'id', width: 15 },
      { header: 'CLIENTE', key: 'client', width: 25 },
      { header: 'VENDEDOR', key: 'seller', width: 20 },
      { header: 'PRODUCTOS', key: 'products', width: 40 },
      { header: 'CANTIDAD', key: 'quantity', width: 12 },
      { header: 'TOTAL', key: 'total', width: 15 },
      { header: 'PAGADO', key: 'paid', width: 15 },
      { header: 'SALDO', key: 'balance', width: 15 },
      { header: 'MÉTODOS PAGO', key: 'paymentMethods', width: 30 }
    ];

    // Aplicar estilo a encabezados
    const salesHeader = salesSheet.getRow(1);
    salesHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    // Agregar datos
    sales.forEach((sale, index) => {
      const products = sale.items.map(item => 
        `${item.product.name} (x${item.quantity})`
      ).join(', ');

      const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      const paidAmount = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = sale.total - paidAmount;
      
      const paymentMethods = sale.payments.map(payment => 
        `${payment.paymentMethod.name}: Bs. ${payment.amount.toFixed(2)}`
      ).join('\n');

      salesSheet.addRow({
        date: sale.createdAt.toLocaleString('es-BO'),
        id: sale.id.substring(0, 8),
        client: sale.client?.nombre || 'N/A',
        seller: sale.seller.name,
        products: products,
        quantity: totalQuantity,
        total: `Bs. ${sale.total.toFixed(2)}`,
        paid: `Bs. ${paidAmount.toFixed(2)}`,
        balance: `Bs. ${balance.toFixed(2)}`,
        paymentMethods: paymentMethods
      });

      // Aplicar bordes
      const row = salesSheet.getRow(index + 2);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Hoja de Evolución Diaria (opcional)
    const dailySheet = workbook.addWorksheet('EVOLUCIÓN DIARIA');
    
    // Agrupar ventas por día
    const salesByDay = new Map();
    
    sales.forEach(sale => {
      const dayKey = sale.createdAt.toISOString().split('T')[0];
      const current = salesByDay.get(dayKey) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += sale.total;
      salesByDay.set(dayKey, current);
    });

    dailySheet.columns = [
      { header: 'FECHA', key: 'date', width: 15 },
      { header: 'VENTAS', key: 'sales', width: 10 },
      { header: 'MONTO', key: 'amount', width: 15 },
      { header: 'TICKET PROMEDIO', key: 'average', width: 18 }
    ];

    const dailyHeader = dailySheet.getRow(1);
    dailyHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });

    let dayRow = 2;
    salesByDay.forEach((data, dayKey) => {
      const date = new Date(dayKey);
      const average = data.count > 0 ? data.amount / data.count : 0;
      
      dailySheet.addRow({
        date: date.toLocaleDateString('es-BO'),
        sales: data.count,
        amount: `Bs. ${data.amount.toFixed(2)}`,
        average: `Bs. ${average.toFixed(2)}`
      });

      dayRow++;
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  async generatePeriodSalesReport(filters: PeriodReportFilters) {
    const { startDate, endDate, branchId, sellerId, sellerIds, paymentMethodId } = filters;
    
    // Ajustar horas para cubrir todo el día
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setHours(0, 0, 0, 0);
    
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    // Obtener ventas del período
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: adjustedStartDate,
          lte: adjustedEndDate
        },
        ...(branchId && { branchId }),
        ...(sellerIds && sellerIds.length > 0
          ? { sellerId: { in: sellerIds } }
          : sellerId
            ? { sellerId }
            : {}),
        ...(paymentMethodId && {
          payments: {
            some: {
              paymentMethodId: paymentMethodId
            }
          }
        })
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: {
          include: {
            paymentMethod: true
          }
        },
        client: true,
        seller: true,
        branch: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Crear workbook similar a generateMonthlySalesReport pero más genérico
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS';
    workbook.created = new Date();

    // Estilos (mismos que en generateMonthlySalesReport)
    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2E86AB' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    // Hoja de Resumen
    const summarySheet = workbook.addWorksheet('RESUMEN PERÍODO');

    // Título
    const startStr = startDate.toLocaleDateString('es-BO');
    const endStr = endDate.toLocaleDateString('es-BO');
    
    summarySheet.mergeCells('A1:F1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `REPORTE DE VENTAS - DEL ${startStr} AL ${endStr}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = headerStyle.fill;
    titleCell.font = headerStyle.font;

    // Información del período
    summarySheet.mergeCells('A3:F3');
    const periodCell = summarySheet.getCell('A3');
    periodCell.value = `PERÍODO: ${startStr} - ${endStr}`;
    periodCell.font = { bold: true };
    periodCell.alignment = { horizontal: 'center' };
    
    // Calcular resumen
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPaid = sales.reduce((sum, sale) => 
      sum + sale.payments.reduce((paidSum, payment) => paidSum + payment.amount, 0), 0);
    const totalBalance = totalAmount - totalPaid;
    const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0;
    const totalItems = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  
    // Resumen General
    const summaryData = [
      ['TOTAL VENTAS:', totalSales],
      ['MONTO TOTAL VENTAS:', `Bs. ${totalAmount.toFixed(2)}`],
      ['TOTAL PAGADO:', `Bs. ${totalPaid.toFixed(2)}`],
      ['SALDO PENDIENTE:', `Bs. ${totalBalance.toFixed(2)}`],
      ['TICKET PROMEDIO:', `Bs. ${averageTicket.toFixed(2)}`],
      ['UNIDADES VENDIDAS:', totalItems]
    ];
  
    summaryData.forEach(([label, value], index) => {
      summarySheet.getCell(`A${index + 5}`).value = label;
      summarySheet.getCell(`B${index + 5}`).value = value;
      summarySheet.getCell(`A${index + 5}`).font = { bold: true };
    });
  
    // Resumen por Método de Pago
    const paymentMethodsMap = new Map();
    
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        const methodName = payment.paymentMethod.name;
        const current = paymentMethodsMap.get(methodName) || { amount: 0, count: 0 };
        current.amount += payment.amount;
        current.count += 1;
        paymentMethodsMap.set(methodName, current);
      });
    });
  
    let paymentRow = 12;
    summarySheet.getCell(`A${paymentRow}`).value = 'RESUMEN POR MÉTODO DE PAGO';
    summarySheet.getCell(`A${paymentRow}`).font = { bold: true, size: 12 };
    summarySheet.mergeCells(`A${paymentRow}:F${paymentRow}`);
  
    paymentRow++;
    paymentMethodsMap.forEach((data, methodName) => {
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;
      summarySheet.getCell(`A${paymentRow}`).value = methodName;
      summarySheet.getCell(`B${paymentRow}`).value = `Bs. ${data.amount.toFixed(2)}`;
      summarySheet.getCell(`C${paymentRow}`).value = `${percentage.toFixed(2)}%`;
      summarySheet.getCell(`D${paymentRow}`).value = data.count;
      paymentRow++;
    });
  
    // Resumen por Vendedor
    const sellersMap = new Map();
    
    sales.forEach(sale => {
      const sellerId = sale.sellerId;
      const sellerName = sale.seller.name;
      const current = sellersMap.get(sellerId) || { name: sellerName, count: 0, amount: 0 };
      current.count += 1;
      current.amount += sale.total;
      sellersMap.set(sellerId, current);
    });
  
    let sellerRow = paymentRow + 2;
    summarySheet.getCell(`A${sellerRow}`).value = 'RESUMEN POR VENDEDOR';
    summarySheet.getCell(`A${sellerRow}`).font = { bold: true, size: 12 };
    summarySheet.mergeCells(`A${sellerRow}:F${sellerRow}`);
  
    sellerRow++;
    sellersMap.forEach((data, sellerId) => {
      const average = data.count > 0 ? data.amount / data.count : 0;
      summarySheet.getCell(`A${sellerRow}`).value = data.name;
      summarySheet.getCell(`B${sellerRow}`).value = data.count;
      summarySheet.getCell(`C${sellerRow}`).value = `Bs. ${data.amount.toFixed(2)}`;
      summarySheet.getCell(`D${sellerRow}`).value = `Bs. ${average.toFixed(2)}`;
      sellerRow++;
    });
  
    // Hoja de Detalle de Ventas
    const salesSheet = workbook.addWorksheet('DETALLE VENTAS');
  
    salesSheet.columns = [
      { header: 'FECHA', key: 'date', width: 20 },
      { header: 'ID VENTA', key: 'id', width: 15 },
      { header: 'CLIENTE', key: 'client', width: 25 },
      { header: 'VENDEDOR', key: 'seller', width: 20 },
      { header: 'PRODUCTOS', key: 'products', width: 40 },
      { header: 'CANTIDAD', key: 'quantity', width: 12 },
      { header: 'TOTAL', key: 'total', width: 15 },
      { header: 'PAGADO', key: 'paid', width: 15 },
      { header: 'SALDO', key: 'balance', width: 15 },
      { header: 'MÉTODOS PAGO', key: 'paymentMethods', width: 30 }
    ];
  
    // Aplicar estilo a encabezados
    const salesHeader = salesSheet.getRow(1);
    salesHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });
  
    // Agregar datos
    sales.forEach((sale, index) => {
      const products = sale.items.map(item => 
        `${item.product.name} (x${item.quantity})`
      ).join(', ');
    
      const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      const paidAmount = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = sale.total - paidAmount;
      
      const paymentMethods = sale.payments.map(payment => 
        `${payment.paymentMethod.name}: Bs. ${payment.amount.toFixed(2)}`
      ).join('\n');
    
      salesSheet.addRow({
        date: sale.createdAt.toLocaleString('es-BO'),
        id: sale.id.substring(0, 8),
        client: sale.client?.nombre || 'N/A',
        seller: sale.seller.name,
        products: products,
        quantity: totalQuantity,
        total: `Bs. ${sale.total.toFixed(2)}`,
        paid: `Bs. ${paidAmount.toFixed(2)}`,
        balance: `Bs. ${balance.toFixed(2)}`,
        paymentMethods: paymentMethods
      });
    
      // Aplicar bordes
      const row = salesSheet.getRow(index + 2);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  
    // Hoja de Evolución Diaria
    const dailySheet = workbook.addWorksheet('EVOLUCIÓN DIARIA');
    
    // Agrupar ventas por día
    const salesByDay = new Map();
    
    sales.forEach(sale => {
      const dayKey = sale.createdAt.toISOString().split('T')[0];
      const current = salesByDay.get(dayKey) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += sale.total;
      salesByDay.set(dayKey, current);
    });
  
    dailySheet.columns = [
      { header: 'FECHA', key: 'date', width: 15 },
      { header: 'VENTAS', key: 'sales', width: 10 },
      { header: 'MONTO', key: 'amount', width: 15 },
      { header: 'TICKET PROMEDIO', key: 'average', width: 18 }
    ];
  
    const dailyHeader = dailySheet.getRow(1);
    dailyHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });
  
    let dayRow = 2;
    salesByDay.forEach((data, dayKey) => {
      const date = new Date(dayKey);
      const average = data.count > 0 ? data.amount / data.count : 0;
      
      dailySheet.addRow({
        date: date.toLocaleDateString('es-BO'),
        sales: data.count,
        amount: `Bs. ${data.amount.toFixed(2)}`,
        average: `Bs. ${average.toFixed(2)}`
      });
    
      dayRow++;
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  async getAvailableSellers(branchId?: number) {
    const sellers = await prisma.user.findMany({
      where: {
        role: {
          in: ['SELLER', 'SUPERVISOR']
        },
        deleted: false,
        ...(branchId ? { branchId } : { branchId: { not: null } })
      },
      select: {
        id: true,
        userCode: true,
        name: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    return sellers;
  },

  async getPeriodSalesPreview(filters: PeriodReportFilters) {
    const { startDate, endDate, branchId, sellerId, sellerIds, paymentMethodId } = filters;

    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setHours(0, 0, 0, 0);

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: adjustedStartDate,
          lte: adjustedEndDate
        },
        ...(branchId && { branchId }),
        ...(sellerIds && sellerIds.length > 0
          ? { sellerId: { in: sellerIds } }
          : sellerId
            ? { sellerId }
            : {}),
        ...(paymentMethodId && {
          payments: {
            some: { paymentMethodId }
          }
        })
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        },
        payments: {
          include: {
            paymentMethod: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPaid = sales.reduce(
      (sum, sale) => sum + sale.payments.reduce((pSum, payment) => pSum + payment.amount, 0),
      0
    );
    const totalBalance = totalAmount - totalPaid;
    const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0;
    const totalUnits = sales.reduce(
      (sum, sale) => sum + sale.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    const sellerRankingMap = new Map<string, { sellerId: string; sellerName: string; role: string; branchId: number; branchName: string; salesCount: number; totalAmount: number; totalUnits: number }>();
    const productRankingMap = new Map<string, { productId: string; productName: string; sku: string; quantity: number; revenue: number }>();
    const weekdayMap = new Map<string, { day: string; salesCount: number; totalAmount: number }>();
    const branchRankingMap = new Map<number, { branchId: number; branchName: string; salesCount: number; totalAmount: number; averageTicket: number }>();

    const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    sales.forEach((sale) => {
      const sellerKey = `${sale.seller.id}-${sale.branchId}`;
      const currentSeller = sellerRankingMap.get(sellerKey) || {
        sellerId: sale.seller.id,
        sellerName: sale.seller.name,
        role: sale.seller.role,
        branchId: sale.branch.id,
        branchName: sale.branch.name,
        salesCount: 0,
        totalAmount: 0,
        totalUnits: 0
      };
      currentSeller.salesCount += 1;
      currentSeller.totalAmount += sale.total;
      currentSeller.totalUnits += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      sellerRankingMap.set(sellerKey, currentSeller);

      const weekdayName = weekDays[sale.createdAt.getDay()];
      const currentWeekday = weekdayMap.get(weekdayName) || { day: weekdayName, salesCount: 0, totalAmount: 0 };
      currentWeekday.salesCount += 1;
      currentWeekday.totalAmount += sale.total;
      weekdayMap.set(weekdayName, currentWeekday);

      const currentBranch = branchRankingMap.get(sale.branch.id) || {
        branchId: sale.branch.id,
        branchName: sale.branch.name,
        salesCount: 0,
        totalAmount: 0,
        averageTicket: 0
      };
      currentBranch.salesCount += 1;
      currentBranch.totalAmount += sale.total;
      currentBranch.averageTicket = currentBranch.totalAmount / currentBranch.salesCount;
      branchRankingMap.set(sale.branch.id, currentBranch);

      sale.items.forEach((item) => {
        const productKey = item.product.id;
        const currentProduct = productRankingMap.get(productKey) || {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          quantity: 0,
          revenue: 0
        };
        currentProduct.quantity += item.quantity;
        currentProduct.revenue += item.unitPrice * item.quantity;
        productRankingMap.set(productKey, currentProduct);
      });
    });

    const previewSales = sales.slice(0, 15).map((sale) => {
      const paidAmount = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return {
        id: sale.id,
        createdAt: sale.createdAt,
        clientName: sale.client?.nombre || 'N/A',
        sellerName: sale.seller.name,
        sellerRole: sale.seller.role,
        branchName: sale.branch.name,
        total: sale.total,
        paid: paidAmount,
        balance: sale.total - paidAmount,
        products: sale.items.map(item => ({
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity
        }))
      };
    });

    return {
      summary: {
        totalSales,
        totalAmount,
        totalPaid,
        totalBalance,
        averageTicket,
        totalUnits
      },
      previewSales,
      rankings: {
        sellers: Array.from(sellerRankingMap.values())
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 15),
        products: Array.from(productRankingMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 15),
        weekdays: Array.from(weekdayMap.values())
          .sort((a, b) => b.totalAmount - a.totalAmount),
        branches: Array.from(branchRankingMap.values())
          .sort((a, b) => b.totalAmount - a.totalAmount)
      },
      generatedAt: new Date()
    };
  },

  async generatePeriodExpensesReport(filters: PeriodReportFilters) {
    const { startDate, endDate, branchId, paymentMethodId } = filters;
    
    // Ajustar horas para cubrir todo el día
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setHours(0, 0, 0, 0);
    
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    // Obtener gastos del período
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: adjustedStartDate,
          lte: adjustedEndDate
        },
        ...(branchId && { branchId }),
        ...(paymentMethodId && { paymentMethodId })
      },
      include: {
        paymentMethod: true,
        user: true,
        branch: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Crear workbook para gastos (similar estructura)
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema POS';
    workbook.created = new Date();

    // Estilos
    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2E86AB' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };
  
    // Hoja de Resumen
    const summarySheet = workbook.addWorksheet('RESUMEN GASTOS');
  
    // Título
    const startStr = startDate.toLocaleDateString('es-BO');
    const endStr = endDate.toLocaleDateString('es-BO');
    
    summarySheet.mergeCells('A1:F1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `REPORTE DE GASTOS - DEL ${startStr} AL ${endStr}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = headerStyle.fill;
    titleCell.font = headerStyle.font;
  
    // Información del período
    summarySheet.mergeCells('A3:F3');
    const periodCell = summarySheet.getCell('A3');
    periodCell.value = `PERÍODO: ${startStr} - ${endStr}`;
    periodCell.font = { bold: true };
    periodCell.alignment = { horizontal: 'center' };
  
    // Calcular resumen
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
  
    // Resumen General
    const summaryData = [
      ['TOTAL GASTOS:', totalExpenses],
      ['MONTO TOTAL:', `Bs. ${totalAmount.toFixed(2)}`],
      ['GASTO PROMEDIO:', `Bs. ${averageExpense.toFixed(2)}`]
    ];
  
    summaryData.forEach(([label, value], index) => {
      summarySheet.getCell(`A${index + 5}`).value = label;
      summarySheet.getCell(`B${index + 5}`).value = value;
      summarySheet.getCell(`A${index + 5}`).font = { bold: true };
    });
  
    // Resumen por Método de Pago
    const paymentMethodsMap = new Map();
    
    expenses.forEach(expense => {
      const methodName = expense.paymentMethod.name;
      const current = paymentMethodsMap.get(methodName) || { amount: 0, count: 0 };
      current.amount += expense.amount;
      current.count += 1;
      paymentMethodsMap.set(methodName, current);
    });
  
    let paymentRow = 9;
    summarySheet.getCell(`A${paymentRow}`).value = 'RESUMEN POR MÉTODO DE PAGO';
    summarySheet.getCell(`A${paymentRow}`).font = { bold: true, size: 12 };
    summarySheet.mergeCells(`A${paymentRow}:F${paymentRow}`);
  
    paymentRow++;
    paymentMethodsMap.forEach((data, methodName) => {
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;
      summarySheet.getCell(`A${paymentRow}`).value = methodName;
      summarySheet.getCell(`B${paymentRow}`).value = `Bs. ${data.amount.toFixed(2)}`;
      summarySheet.getCell(`C${paymentRow}`).value = `${percentage.toFixed(2)}%`;
      summarySheet.getCell(`D${paymentRow}`).value = data.count;
      paymentRow++;
    });
  
    // Resumen por Usuario
    const usersMap = new Map();
    
    expenses.forEach(expense => {
      const userId = expense.createdBy;
      const userName = expense.user?.name || 'N/A';
      const current = usersMap.get(userId) || { name: userName, count: 0, amount: 0 };
      current.count += 1;
      current.amount += expense.amount;
      usersMap.set(userId, current);
    });
  
    let userRow = paymentRow + 2;
    summarySheet.getCell(`A${userRow}`).value = 'RESUMEN POR USUARIO';
    summarySheet.getCell(`A${userRow}`).font = { bold: true, size: 12 };
    summarySheet.mergeCells(`A${userRow}:F${userRow}`);
  
    userRow++;
    usersMap.forEach((data, userId) => {
      const average = data.count > 0 ? data.amount / data.count : 0;
      summarySheet.getCell(`A${userRow}`).value = data.name;
      summarySheet.getCell(`B${userRow}`).value = data.count;
      summarySheet.getCell(`C${userRow}`).value = `Bs. ${data.amount.toFixed(2)}`;
      summarySheet.getCell(`D${userRow}`).value = `Bs. ${average.toFixed(2)}`;
      userRow++;
    });
  
    // Hoja de Detalle de Gastos
    const expensesSheet = workbook.addWorksheet('DETALLE GASTOS');
  
    expensesSheet.columns = [
      { header: 'FECHA', key: 'date', width: 20 },
      { header: 'ID', key: 'id', width: 10 },
      { header: 'CONCEPTO', key: 'concept', width: 40 },
      { header: 'MONTO', key: 'amount', width: 15 },
      { header: 'MÉTODO DE PAGO', key: 'paymentMethod', width: 20 },
      { header: 'USUARIO', key: 'user', width: 25 },
      { header: 'SUCURSAL', key: 'branch', width: 25 }
    ];
  
    // Aplicar estilo a encabezados
    const expensesHeader = expensesSheet.getRow(1);
    expensesHeader.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.border = headerStyle.border;
    });
  
    // Agregar datos
    expenses.forEach((expense, index) => {
      expensesSheet.addRow({
        date: expense.createdAt.toLocaleString('es-BO'),
        id: expense.id,
        concept: expense.concept,
        amount: `Bs. ${expense.amount.toFixed(2)}`,
        paymentMethod: expense.paymentMethod.name,
        user: expense.user?.name || 'N/A',
        branch: expense.branch?.name || 'N/A'
      });
    
      // Aplicar bordes
      const row = expensesSheet.getRow(index + 2);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

};
