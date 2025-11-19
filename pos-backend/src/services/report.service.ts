import ExcelJS from 'exceljs';
import { prisma } from '../prismaClient';
import { PaymentStatus } from '@prisma/client'; // Importar el enum

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
  }
};