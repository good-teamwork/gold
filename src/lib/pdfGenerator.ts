import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  invoiceId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  gstNumber: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  date: string;
  upiId?: string;
}

export const generateReceiptPDF = async (receiptData: ReceiptData): Promise<void> => {
  const pdf = new jsPDF({ compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 25; // extra top/bottom room so headers/footers aren't clipped
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    pdf.text(lines, margin, yPosition, { align });
    yPosition += lines.length * (fontSize * 0.4);
  };

  // Numeric text helper: monospaced to avoid broken spacing in some PDF viewers
  const addNum = (text: string, x: number, y: number, size: number = 10) => {
    pdf.setFontSize(size);
    pdf.setFont('courier', 'normal');
    pdf.text(text, x, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
  };

  // Header (centered block)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(receiptData.businessName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(receiptData.businessAddress, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4.5;
  pdf.text(`Phone: ${receiptData.businessPhone}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4.5;
  pdf.text(`Email: ${receiptData.businessEmail}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4.5;
  pdf.text(`GST: ${receiptData.gstNumber}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Invoice Details
  addText(`INVOICE #${receiptData.invoiceId}`, 14, true);
  addText(`Date: ${new Date(receiptData.date).toLocaleDateString()}`, 10);
  addText(`Customer: ${receiptData.customerName}`, 10);
  if (receiptData.customerPhone) {
    addText(`Phone: ${receiptData.customerPhone}`, 10);
  }
  
  yPosition += 10;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Items Table Header
  addText('ITEMS', 12, true);
  yPosition += 5;
  
  // Table headers
  const colWidths = [90, 20, 30, 30];
  const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Item', colPositions[0], yPosition);
  pdf.text('Qty', colPositions[1], yPosition);
  pdf.text('Price', colPositions[2], yPosition);
  pdf.text('Total', colPositions[3], yPosition);
  yPosition += 5;
  
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Items
  pdf.setFont('helvetica', 'normal');
  receiptData.items.forEach(item => {
    const lines = pdf.splitTextToSize(item.name, colWidths[0] - 5);
    const maxLines = Math.max(lines.length, 1);
    
    pdf.text(lines, colPositions[0], yPosition);
    addNum(item.quantity.toString(), colPositions[1], yPosition);
    addNum(`₹${item.price.toLocaleString()}`, colPositions[2], yPosition);
    addNum(`₹${item.total.toLocaleString()}`, colPositions[3], yPosition);
    
    yPosition += maxLines * 5 + 2;
  });

  yPosition += 5;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Totals
  // Totals block (right aligned)
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal:', pageWidth - margin - 40, yPosition);
  addNum(`₹${receiptData.subtotal.toLocaleString()}`, pageWidth - margin, yPosition);
  yPosition += 6;
  pdf.text('Tax (8%):', pageWidth - margin - 40, yPosition);
  addNum(`₹${receiptData.tax.toLocaleString()}`, pageWidth - margin, yPosition);
  yPosition += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total:', pageWidth - margin - 40, yPosition);
  addNum(`₹${receiptData.total.toLocaleString()}`, pageWidth - margin, yPosition, 12);
  
  yPosition += 10;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Payment Method
  addText(`Payment Method: ${receiptData.paymentMethod}`, 10, true);
  if (receiptData.upiId && receiptData.paymentMethod.toLowerCase().includes('upi')) {
    addText(`UPI ID: ${receiptData.upiId}`, 10);
  }

  // Footer (centered and lifted above bottom)
  yPosition = Math.max(yPosition + 10, pdf.internal.pageSize.getHeight() - 30);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Please keep this receipt for your records.', pageWidth / 2, yPosition, { align: 'center' });

  // Download the PDF
  pdf.save(`receipt-${receiptData.invoiceId}.pdf`);
};

export const generateReceiptFromElement = async (elementId: string, filename: string = 'receipt.pdf'): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;

  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
};
