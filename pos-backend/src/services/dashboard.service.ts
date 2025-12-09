import { prisma } from "../prismaClient";
import { BranchDashboardDTO, GeneralDashboardDTO } from "../dtos/dashboard.dto";

export const dashboardService = {
  // Dashboard por sucursal
  async getBranchDashboard(branchId: number, date?: Date): Promise<BranchDashboardDTO> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Obtener información de la sucursal
    const branch = await prisma.branch.findUnique({
      where: { id: branchId, isActive: true },
      select: { id: true, name: true }
    });

    if (!branch) {
      throw { status: 404, message: "Sucursal no encontrada o inactiva" };
    }

    // 1. Ventas del día
    const salesToday = await prisma.sale.findMany({
      where: {
        branchId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        seller: true,
        client: true
      }
    });

    // Calcular métricas de ventas
    const salesCount = salesToday.length;
    const salesAmount = salesToday.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calcular ganancias (costo vs venta)
    let totalCost = 0;
    let totalRevenue = 0;
    
    for (const sale of salesToday) {
      totalRevenue += sale.total;
      for (const item of sale.items) {
        totalCost += (item.product.costPrice * item.quantity);
      }
    }
    
    const grossEarnings = totalRevenue - totalCost;
    const averageTicket = salesCount > 0 ? salesAmount / salesCount : 0;

    // 2. Estado de caja
    const cashBox = await prisma.cashBox.findFirst({
      where: {
        branchId,
        status: "OPEN",
        openedAt: {
          lte: endOfDay
        }
      },
      include: {
        openedByUser: true
      },
      orderBy: { openedAt: 'desc' }
    });

    // 3. Productos más vendidos del día
    const productSalesMap = new Map();
    
    for (const sale of salesToday) {
      for (const item of sale.items) {
        const productId = item.productId;
        const current = productSalesMap.get(productId) || {
          productId,
          productName: item.product.name,
          quantity: 0,
          amount: 0
        };
        
        current.quantity += item.quantity;
        current.amount += item.subtotal;
        productSalesMap.set(productId, current);
      }
    }
    
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Vendedores destacados
    const sellerMap = new Map();
    
    for (const sale of salesToday) {
      const sellerId = sale.sellerId;
      const current = sellerMap.get(sellerId) || {
        userId: sellerId,
        userName: sale.seller.name,
        salesCount: 0,
        amount: 0
      };
      
      current.salesCount += 1;
      current.amount += sale.total;
      sellerMap.set(sellerId, current);
    }
    
    const topSellers = Array.from(sellerMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // 5. Productos con stock bajo (< 10 unidades)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        branchId,
        stock: {
          lt: 10
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        stock: true
      },
      take: 10
    });

    // 6. Últimas ventas (5 más recientes)
    const recentSales = await prisma.sale.findMany({
      where: {
        branchId
      },
      include: {
        client: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 7. Totales de la sucursal
    const totalClients = await prisma.cliente.count();
    const totalProducts = await prisma.product.count({
      where: { branchId, isActive: true }
    });
    const totalUsers = await prisma.user.count({
      where: { branchId, deleted: false }
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      branchId: branch.id,
      branchName: branch.name,
      salesToday: {
        count: salesCount,
        amount: salesAmount
      },
      earningsToday: {
        grossEarnings,
        netEarnings: grossEarnings // Por ahora netEarnings = grossEarnings
      },
      averageTicket,
      cashBoxStatus: {
        isOpen: !!cashBox,
        currentAmount: cashBox?.initialAmount,
        openedAt: cashBox?.openedAt,
        openedBy: cashBox?.openedByUser?.name
      },
      topProducts,
      topSellers,
      lowStockProducts: lowStockProducts.map(p => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.stock,
        minThreshold: 10
      })),
      recentSales: recentSales.map(sale => ({
        saleId: sale.id,
        clientName: sale.client?.nombre,
        total: sale.total,
        createdAt: sale.createdAt
      })),
      summary: {
        totalClients,
        totalProducts,
        totalUsers
      }
    };
  },

  // Dashboard general (admin)
  async getGeneralDashboard(date?: Date): Promise<GeneralDashboardDTO> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 1. Obtener todas las sucursales activas
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    // 2. Resumen global
    const activeBranches = branches.length;
    const totalBranches = await prisma.branch.count();

    // Ventas totales del día en todas las sucursales
    const salesToday = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        branch: true
      }
    });

    const totalSalesToday = salesToday.length;
    const totalAmountToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);

    // Usuarios activos hoy (que hayan realizado al menos una venta)
    const activeUsersToday = await prisma.user.findMany({
      where: {
        Sale: {
          some: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }
      },
      distinct: ['id']
    });

    // 3. Ranking de sucursales por ventas del día
    const branchSalesMap = new Map();
    
    for (const sale of salesToday) {
      const branchId = sale.branchId;
      const current = branchSalesMap.get(branchId) || {
        branchId,
        branchName: sale.branch?.name || 'Desconocida',
        salesCount: 0,
        totalAmount: 0,
        sales: []
      };
      
      current.salesCount += 1;
      current.totalAmount += sale.total;
      current.sales.push(sale);
      branchSalesMap.set(branchId, current);
    }

    const branchRanking = Array.from(branchSalesMap.values())
      .map(branch => ({
        ...branch,
        averageTicket: branch.salesCount > 0 ? branch.totalAmount / branch.salesCount : 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // 4. Productos más vendidos globalmente
    const globalProductMap = new Map();
    
    for (const sale of salesToday) {
      for (const item of sale.items) {
        const productId = item.productId;
        const current = globalProductMap.get(productId) || {
          productId,
          productName: item.product.name,
          totalQuantity: 0,
          totalAmount: 0,
          branches: new Set<string>()
        };
        
        current.totalQuantity += item.quantity;
        current.totalAmount += item.subtotal;
        if (sale.branch?.name) {
          current.branches.add(sale.branch.name);
        }
        globalProductMap.set(productId, current);
      }
    }

    const globalTopProducts = Array.from(globalProductMap.values())
      .map(p => ({
        ...p,
        branches: Array.from(p.branches)
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // 5. Evolución de ventas (últimos 7 días)
    const salesEvolution = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const daySales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });
      
      salesEvolution.push({
        date: dayStart.toISOString().split('T')[0],
        totalAmount: daySales.reduce((sum, sale) => sum + sale.total, 0),
        salesCount: daySales.length
      });
    }

    // 6. Sucursales con alertas
    const branchesWithAlerts = [];
    
    for (const branch of branches) {
      const alerts = [];
      
      // Verificar si hay caja abierta
      const openCashBox = await prisma.cashBox.findFirst({
        where: {
          branchId: branch.id,
          status: "OPEN"
        }
      });
      
      if (!openCashBox) {
        alerts.push("Sin caja abierta");
      }
      
      // Verificar si hay ventas hoy
      const hasSalesToday = salesToday.some(sale => sale.branchId === branch.id);
      if (!hasSalesToday) {
        alerts.push("Sin ventas hoy");
      }
      
      // Verificar productos con stock bajo
      const lowStockCount = await prisma.product.count({
        where: {
          branchId: branch.id,
          stock: { lt: 5 },
          isActive: true
        }
      });
      
      if (lowStockCount > 0) {
        alerts.push(`${lowStockCount} productos con stock bajo`);
      }
      
      if (alerts.length > 0) {
        branchesWithAlerts.push({
          branchId: branch.id,
          branchName: branch.name,
          alerts
        });
      }
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      globalSummary: {
        totalBranches,
        activeBranches,
        totalSalesToday,
        totalAmountToday,
        activeUsersToday: activeUsersToday.length
      },
      branchRanking,
      globalTopProducts,
      salesEvolution,
      branchesWithAlerts
    };
  }
};