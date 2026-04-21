import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  saleId: string;
  saleNumber?: number;
  date: string;
  clientName: string;
  clientPhone?: string;
  sellerName: string;
  sellerCode: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    sku?: string;
    serialNumbers?: string[];
  }>;
  payments: Array<{
    method: string;
    amount: number;
    date: string;
  }>;
  total: number;
  totalPaid: number;
  balance: number;
  paymentStatus: string;
}

export interface ReceiptSettings {
  logo: string | null;
  companyName: string;
  address: string;
  phone: string;
}

class PdfService {
  async generateReceipt(
    receiptData: ReceiptData, 
    settings: ReceiptSettings,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Crear elemento HTML temporal para el comprobante
        const receiptElement = this.createReceiptElement(receiptData, settings);
        document.body.appendChild(receiptElement);

        if (onProgress) onProgress(30);

        // Convertir a canvas
        const canvas = await html2canvas(receiptElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: (clonedDoc) => {
            // Asegurar que las imágenes se carguen en el documento clonado
            const imgElements = clonedDoc.querySelectorAll('img');
            imgElements.forEach((img) => {
              if (img.src.startsWith('data:')) {
                img.crossOrigin = 'anonymous';
              }
            });
          }
        });

        if (onProgress) onProgress(80);

        document.body.removeChild(receiptElement);

        // Convertir canvas a PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        //const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcular dimensiones manteniendo proporción
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgHeight / imgWidth;
        const pdfImgHeight = pdfWidth * ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfImgHeight);

        if (onProgress) onProgress(100);

        // Generar blob
        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);

      } catch (error) {
        reject(error);
      }
    });
  }

  private createReceiptElement(receiptData: ReceiptData, settings: ReceiptSettings): HTMLDivElement {
    const element = document.createElement('div');
    element.style.width = '210mm';
    element.style.minHeight = '297mm';
    element.style.padding = '20mm';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.fontSize = '12px';
    element.style.color = '#000';
    element.style.backgroundColor = 'white';
    element.style.boxSizing = 'border-box';

    element.innerHTML = this.getReceiptHTML(receiptData, settings);
    return element;
  }

  private getReceiptHTML(receiptData: ReceiptData, settings: ReceiptSettings): string {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string): string => {
      return new Date(dateString).toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return `
      <div style="border: 2px solid #000; padding: 20px; min-height: 250mm;">
        <!-- Encabezado -->
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
          ${settings.logo ? `
            <div style="margin-bottom: 10px;">
              <img src="${settings.logo}" alt="Logo" style="max-height: 60px; max-width: 200px;" />
            </div>
          ` : ''}
          
          <h1 style="margin: 5px 0; font-size: 24px; font-weight: bold;">${settings.companyName}</h1>
          ${settings.address ? `<p style="margin: 2px 0; font-size: 12px;">${settings.address}</p>` : ''}
          ${settings.phone ? `<p style="margin: 2px 0; font-size: 12px;">Tel: ${settings.phone}</p>` : ''}
          <h2 style="margin: 15px 0 5px 0; font-size: 18px;">COMPROBANTE DE VENTA</h2>
        </div>

        <!-- Información de la venta -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <strong>N° Venta:</strong> ${receiptData.saleNumber ?? receiptData.saleId}<br>
            <strong>Fecha:</strong> ${formatDate(receiptData.date)}<br>
            <strong>Vendedor:</strong> ${receiptData.sellerName}
          </div>
          <div>
            <strong>Cliente:</strong> ${receiptData.clientName}<br>
            ${receiptData.clientPhone ? `<strong>Teléfono:</strong> ${receiptData.clientPhone}<br>` : ''}
            <strong>Estado:</strong> ${receiptData.paymentStatus}
          </div>
        </div>

        <!-- Productos -->
        <div style="margin-bottom: 20px;">
          <h3 style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">PRODUCTOS</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 8px 5px; width: 40%;">Producto</th>
                <th style="text-align: center; padding: 8px 5px; width: 15%;">Cantidad</th>
                <th style="text-align: right; padding: 8px 5px; width: 20%;">P. Unit.</th>
                <th style="text-align: right; padding: 8px 5px; width: 25%;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${receiptData.items.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px 5px;">
                    ${item.name}
                    ${item.sku ? `<br><small style="color: #666;">SKU: ${item.sku}</small>` : ''}
                    ${item.serialNumbers?.length ? `<br><small style="color: #0a66c2;">Series: ${item.serialNumbers.join(', ')}</small>` : ''}
                  </td>
                  <td style="text-align: center; padding: 8px 5px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 8px 5px;">${formatCurrency(item.unitPrice)}</td>
                  <td style="text-align: right; padding: 8px 5px; font-weight: bold;">${formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagos -->
        ${receiptData.payments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">PAGOS</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #ddd;">
                  <th style="text-align: left; padding: 8px 5px; width: 40%;">Método</th>
                  <th style="text-align: left; padding: 8px 5px; width: 30%;">Fecha</th>
                  <th style="text-align: right; padding: 8px 5px; width: 30%;">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${receiptData.payments.map(payment => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 5px;">${payment.method}</td>
                    <td style="padding: 8px 5px;">${formatDate(payment.date)}</td>
                    <td style="text-align: right; padding: 8px 5px; font-weight: bold;">${formatCurrency(payment.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Totales -->
        <div style="border: 1px solid #000; padding: 15px; background: #f9f9f9;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="text-align: right; font-weight: bold;">Total:</div>
            <div style="text-align: right; font-weight: bold; font-size: 14px;">${formatCurrency(receiptData.total)}</div>
            
            <div style="text-align: right; font-weight: bold;">Pagado:</div>
            <div style="text-align: right; font-weight: bold; color: ${receiptData.totalPaid < receiptData.total ? '#e67e22' : '#27ae60'};">
              ${formatCurrency(receiptData.totalPaid)}
            </div>
            
            <div style="text-align: right; font-weight: bold; border-top: 1px solid #000; padding-top: 5px;">Saldo:</div>
            <div style="text-align: right; font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; color: ${receiptData.balance > 0 ? '#e74c3c' : '#27ae60'};">
              ${formatCurrency(receiptData.balance)}
            </div>
          </div>
        </div>

        <!-- Pie de página -->
        <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #666;">
          <p>¡Gracias por su compra!</p>
          <p>Comprobante generado el ${new Date().toLocaleString('es-BO')}</p>
        </div>
      </div>
    `;
  }

  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const pdfService = new PdfService();
