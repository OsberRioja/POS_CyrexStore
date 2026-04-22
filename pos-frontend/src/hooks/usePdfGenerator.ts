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
      const finalFilename = filename || defaultFilename;

      // ✅ SOLO descarga
      pdfService.downloadPDF(pdfBlob, finalFilename);

    } catch (error) {
      console.error('Error al descargar comprobante:', error);
      throw error;
    }
  };

  const sendReceiptWhatsApp = async (saleData: any) => {
    try {
      const pdfBlob = await generateReceipt(saleData);

      const saleRef = saleData.saleNumber ?? saleData.id;
      const filename = `comprobante-${saleRef}.pdf`;

      // Subir al backend
      const formData = new FormData();
      formData.append('file', pdfBlob, filename);
      formData.append('saleId', saleData.id.toString());

      const response = await fetch('http://localhost:3000/api/comprobantes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const pdfUrl = data.pdfUrl;

      // 📱 Número del cliente
      const phone = saleData.client?.telefono;

      if (!phone) {
        alert('El cliente no tiene número de teléfono');
        return;
      }

      // 💬 Mensaje
      const message = `Hola ${saleData.client?.nombre || 'cliente'}, aquí tienes tu comprobante:\n${pdfUrl}`;

      // Abrir WhatsApp
      sendToWhatsApp(phone, message);

    } catch (error) {
      console.error('Error enviando por WhatsApp:', error);
      alert('No se pudo enviar el comprobante por WhatsApp');
    }
  };  

  const sendToWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  }

  return {
    generateReceipt,
    downloadReceipt,
    sendReceiptWhatsApp,
    isGenerating,
    progress
  };
};
