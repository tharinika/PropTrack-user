import jsPDF from 'jspdf';

interface InvoiceData {
  // Invoice Details
  invoiceNumber?: string;
  invoiceMonth: string;
  invoiceYear: string;
  invoiceDate: string;
  paymentDate?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  
  // Tenant Details
  tenantName: string;
  tenantEmail: string;
  
  // Landlord Details
  landlordName: string;
  
  // Property Details
  propertyName: string;
  unitNumber: string;
  
  // Payment Breakdown
  baseRent: number;
  electricity: number;
  waterBill: number;
  gasBill: number;
  maintenanceFee: number;
  totalAmount: number;
}

// ============================================================================
// CURRENCY FORMATTER - Proper INR formatting without encoding issues
// ============================================================================
const formatCurrency = (amount: number): string => {
  // Format number with Indian numbering system (lakhs/crores)
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  // Use Rs. prefix to avoid ₹ symbol encoding issues in PDF
  return `Rs. ${formatted}`;
};

export function generateInvoicePDF(data: InvoiceData) {
  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // ============================================================================
  // COLORS - PropTrack Brand
  // ============================================================================
  const primaryGreen = [34, 197, 94]; // #22c55e
  const darkGray = [55, 65, 81]; // #374151
  const lightGray = [156, 163, 175]; // #9ca3af

  // ============================================================================
  // HEADER SECTION WITH LOGO
  // ============================================================================
  
  // PropTrack Logo (Styled Text)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('PropTrack', margin, currentY + 8);
  
  // Add subtle underline/accent for logo
  doc.setDrawColor(...primaryGreen);
  doc.setLineWidth(1);
  doc.line(margin, currentY + 10, margin + 45, currentY + 10);
  
  currentY += 15;
  
  // Invoice Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('RENT INVOICE', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;
  
  // Divider line
  doc.setDrawColor(...primaryGreen);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 10;

  // ============================================================================
  // LANDLORD & TENANT DETAILS (Two Columns)
  // ============================================================================
  
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;
  
  // Landlord Details (Left Column)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('FROM', col1X, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(data.landlordName, col1X, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.text('Landlord', col1X, currentY + 11);
  
  // Tenant Details (Right Column)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('TO', col2X, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(data.tenantName, col2X, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.text(data.tenantEmail, col2X, currentY + 11);
  
  currentY += 25;

  // ============================================================================
  // PROPERTY DETAILS
  // ============================================================================
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('PROPERTY DETAILS', margin, currentY);
  
  currentY += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${data.propertyName} - Unit ${data.unitNumber}`, margin, currentY);
  
  currentY += 15;

  // ============================================================================
  // INVOICE DETAILS
  // ============================================================================
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', margin, currentY);
  
  currentY += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  
  // Invoice Number (if provided)
  if (data.invoiceNumber) {
    doc.text('Invoice Number:', margin, currentY);
    doc.text(data.invoiceNumber, margin + 40, currentY);
    currentY += 5;
  }
  
  // Invoice Month
  doc.text('Invoice Period:', margin, currentY);
  doc.text(`${data.invoiceMonth} ${data.invoiceYear}`, margin + 40, currentY);
  currentY += 5;
  
  // Invoice Date
  doc.text('Invoice Date:', margin, currentY);
  doc.text(data.invoiceDate, margin + 40, currentY);
  currentY += 5;
  
  // Payment Date (if paid)
  if (data.paymentDate && data.paymentStatus === 'paid') {
    doc.text('Payment Date:', margin, currentY);
    doc.text(data.paymentDate, margin + 40, currentY);
    currentY += 5;
  }
  
  currentY += 10;

  // ============================================================================
  // BILL BREAKDOWN TABLE
  // ============================================================================
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL BREAKDOWN', margin, currentY);
  
  currentY += 7;
  
  // Table Header Background
  doc.setFillColor(...primaryGreen);
  doc.rect(margin, currentY - 4, pageWidth - 2 * margin, 8, 'F');
  
  // Table Header Text
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', margin + 2, currentY);
  doc.text('AMOUNT', pageWidth - margin - 2, currentY, { align: 'right' });
  
  currentY += 8;
  
  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  
  const addRow = (label: string, amount: number, isBold = false) => {
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    }
    
    // Alternating row background
    if (!isBold) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, currentY - 4, pageWidth - 2 * margin, 6, 'F');
    }
    
    doc.text(label, margin + 2, currentY);
    // Use proper currency formatter and right alignment
    doc.text(formatCurrency(amount), pageWidth - margin - 2, currentY, { align: 'right' });
    
    currentY += 6;
    
    if (isBold) {
      doc.setFont('helvetica', 'normal');
    }
  };
  
  // Add breakdown rows (only if amount > 0)
  addRow('Base Rent', data.baseRent);
  
  if (data.electricity > 0) {
    addRow('Electricity Bill', data.electricity);
  }
  
  if (data.waterBill > 0) {
    addRow('Water Bill', data.waterBill);
  }
  
  if (data.gasBill > 0) {
    addRow('Gas Bill', data.gasBill);
  }
  
  if (data.maintenanceFee > 0) {
    addRow('Maintenance Fee', data.maintenanceFee);
  }
  
  currentY += 3;
  
  // Total line
  doc.setDrawColor(...darkGray);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 7;
  
  // Total Amount (Bold and Highlighted with proper formatting)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('TOTAL', margin + 2, currentY);
  doc.text(formatCurrency(data.totalAmount), pageWidth - margin - 2, currentY, { align: 'right' });
  
  currentY += 15;

  // ============================================================================
  // PAYMENT STATUS
  // ============================================================================
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('PAYMENT STATUS', margin, currentY);
  
  currentY += 7;
  
  // Status Badge
  const statusColors: Record<typeof data.paymentStatus, number[]> = {
    paid: [34, 197, 94], // green
    pending: [249, 115, 22], // orange
    overdue: [239, 68, 68] // red
  };
  
  const statusText: Record<typeof data.paymentStatus, string> = {
    paid: 'PAID',
    pending: 'PENDING',
    overdue: 'OVERDUE'
  };
  
  const statusColor = statusColors[data.paymentStatus];
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, currentY - 5, 30, 8, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText[data.paymentStatus], margin + 15, currentY, { align: 'center' });
  
  currentY += 15;

  // ============================================================================
  // FOOTER
  // ============================================================================
  
  // Position footer at bottom of page
  currentY = pageHeight - 30;
  
  // Divider line
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 7;
  
  // Thank you message
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...lightGray);
  doc.text('Thank you for your payment', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 6;
  
  // PropTrack footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by PropTrack - Property Management System', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 4;
  
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, currentY, { align: 'center' });

  // ============================================================================
  // SAVE PDF
  // ============================================================================
  
  const fileName = `Invoice_${data.invoiceMonth}_${data.invoiceYear}.pdf`;
  doc.save(fileName);
  
  console.log('[PDF GENERATOR] Invoice generated:', fileName);
}