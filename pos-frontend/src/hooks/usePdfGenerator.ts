import { useState } from 'react';
import { pdfService } from '../services/pdfService';
import type { ReceiptData } from '../services/pdfService';
import { useSettings } from '../context/settingsContext';

export const usePdfGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { receiptSettings } = useSettings();

  const generateReceipt = async (saleData: any): Promise<Blob> => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Transformar datos de la venta al formato del comprobante
      const receiptData: ReceiptData = {
        saleId: saleData.id,
        saleNumber: saleData.saleNumber,
        date: saleData.createdAt,
        clientName: saleData.client?.nombre || 'Cliente General',
        clientPhone: saleData.client?.telefono,
        sellerName: saleData.seller?.name,
        sellerCode: saleData.seller?.userCode,
        items: saleData.items?.map((item: any) => ({
          name: item.product?.name || 'Producto',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          sku: item.product?.sku,
          serialNumbers: item.serialNumbers || []
        })) || [],
        payments: saleData.payments?.map((payment: any) => ({
          method: payment.paymentMethod?.name || 'N/A',
          amount: payment.amount,
          date: payment.createdAt
        })) || [],
        total: saleData.total,
        totalPaid: saleData.totalPaid,
        balance: saleData.balance,
        paymentStatus: saleData.paymentStatus
      };

      const pdfBlob = await pdfService.generateReceipt(
        receiptData, 
        receiptSettings,
        (progress) => setProgress(progress)
      );

      return pdfBlob;
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const downloadReceipt = async (saleData: any, filename?: string) => {
    try {
      const pdfBlob = await generateReceipt(saleData);
      const saleRef = saleData.saleNumber ?? saleData.id;
      const defaultFilename = `comprobante-${saleRef}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdfService.downloadPDF(pdfBlob, filename || defaultFilename);
    } catch (error) {
      console.error('Error al descargar comprobante:', error);
      throw error;
    }
  };

  return {
    generateReceipt,
    downloadReceipt,
    isGenerating,
    progress
  };
};
