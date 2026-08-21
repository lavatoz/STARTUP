import { jsPDF } from 'jspdf';

// Deprecated legacy APCO branding banner image
export const apcoFooterBase64 = "";

/**
 * Draws the dynamic text branding footer centered horizontally at the bottom of the page.
 */
export function drawBrandingFooter(
  doc: jsPDF,
  pageWidth: number,
  contentWidth: number,
  documentId?: string,
  currentPage?: number,
  totalPages?: number
): void {
  void contentWidth;
  
  const pageNum = currentPage || 1;
  const totalPagesCount = totalPages || doc.getNumberOfPages();
  const footerText = `Page ${pageNum} of ${totalPagesCount}  |  Secure Document Registry`;
  const footerY = doc.internal.pageSize.getHeight() - 8;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(111, 106, 97); // #6F6A61

  const textWidth = doc.getTextWidth(footerText);
  const textX = (pageWidth - textWidth) / 2;
  doc.text(footerText, textX, footerY);

  if (documentId) {
    const cleanId = String(documentId).trim();
    // Dynamically resolve verification URL based on the application's active origin
    const verifyUrl = `${window.location.origin}/verify/${cleanId}`;
    const textY = doc.internal.pageSize.getHeight() - 4;
    
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    const textPrefix = 'Verification URL: ';
    const fullText = `${textPrefix}${verifyUrl}`;
    const fullWidth = doc.getTextWidth(fullText);
    const startX = (pageWidth - fullWidth) / 2;
    doc.text(fullText, startX, textY);
    
    const prefixWidth = doc.getTextWidth(textPrefix);
    doc.textWithLink(verifyUrl, startX + prefixWidth, textY, { url: verifyUrl });
  }
}

/**
 * Applies the dynamic text branding footer across all pages of a jsPDF document.
 */
export function applyBrandingFooterToDoc(doc: jsPDF, pageWidth: number, contentWidth: number, documentId?: string): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawBrandingFooter(doc, pageWidth, contentWidth, documentId, i, pageCount);
  }
}
