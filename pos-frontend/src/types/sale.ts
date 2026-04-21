export interface Sale {
    id: string;
    saleNumber: number;
    total: number;
    totalPaid: number;
    balance: number;
    paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID';
    createdAt: string;
    sellerId: string;
    clientId?: number;
    cashBoxId?: number;
    branchId: number;
    items: SaleItem[];
    payments: SalePayment[];
    client?: any;
    seller?: any;
}

export interface SaleItem {
    id?: number;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    originalPrice?: number;
    originalCurrency?: string;
    conversionRate?: number;
    serialNumbers?: string[];
    product?: {
        name: string;
        sku: string;
    };
}

export interface SalePayment {
    id?: number;
    paymentMethodId: number;
    amount: number;
    paymentMethod?: {
        name: string;
        isCash: boolean;
    };
}

export interface EditSaleFormData {
    items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        originalPrice?: number;
        originalCurrency?: string;
        conversionRate?: number;
    }>;
    payments: Array<{
        paymentMethodId: number;
        amount: number;
    }>;
    client?: any;
    allowPartialPayment?: boolean;
}
