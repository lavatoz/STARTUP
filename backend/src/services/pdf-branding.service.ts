import { PDFDocument } from 'pdf-lib';

/**
 * Loads the APCO family branding footer image (disabled for Studio branding).
 */
export async function loadFooterImage(pdfDoc: PDFDocument): Promise<any> {
  void pdfDoc;
  return null;
}

/**
 * Applies the Dynamic branding footer across all pages of a PDF document.
 */
export async function applyBrandingFooterToDoc(
  pdfDoc: PDFDocument,
  footerEmbed: any,
  pageWidth: number,
  contentWidth: number
): Promise<void> {
  void footerEmbed;
  void pageWidth;
  void contentWidth;
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const actualPageWidth = page.getWidth();
    const pageIndex = pages.indexOf(page) + 1;
    const footerText = `Page ${pageIndex} of ${pages.length}  |  Secure Document Registry`;
    const fontSize = 7.5;
    const textWidth = fontRegular.widthOfTextAtSize(footerText, fontSize);
    const x = (actualPageWidth - textWidth) / 2;
    const y = 35;

    page.drawText(footerText, {
      x,
      y,
      size: fontSize,
      font: fontRegular,
      color: rgb(111/255, 106/255, 97/255), // #6F6A61
    });
  }
}

import { StandardFonts, rgb, PDFName, PDFArray, PDFString } from 'pdf-lib';

/**
 * Draws the verification link immediately above the branded black footer or the standard page footer.
 */
export async function applyVerificationFooterToDoc(
  pdfDoc: PDFDocument,
  verificationUrl: string,
  options?: { hasBlackFooter?: boolean; margin?: number }
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const textColor = rgb(107 / 255, 114 / 255, 128 / 255); // #6B7280
  
  const hasBlackFooter = options?.hasBlackFooter ?? false;
  const margin = options?.margin ?? 40;
  
  const yStart = hasBlackFooter ? 108 : 53;

  const textWidth = font.widthOfTextAtSize(verificationUrl, 7.5);
  const textHeight = font.heightAtSize(7.5);

  const linkX1 = margin;
  const linkY1 = yStart - 2.0;
  const linkX2 = margin + textWidth;
  const linkY2 = yStart + textHeight + 1.0;

  const { context } = pdfDoc;

  // Create the URI action once
  const uriAction = context.obj({
    Type: 'Action',
    S: 'URI',
    URI: PDFString.of(verificationUrl),
  });

  for (const page of pages) {
    page.drawText('Verify this document:', {
      x: margin,
      y: yStart + 10.5,
      size: 7.5,
      font: font,
      color: textColor,
    });

    page.drawText(verificationUrl, {
      x: margin,
      y: yStart,
      size: 7.5,
      font: font,
      color: textColor,
    });

    // Create the link annotation for each page with exact matching coordinates
    const linkAnnotation = context.register(
      context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        P: page.ref,
        Rect: [linkX1, linkY1, linkX2, linkY2],
        Border: [0, 0, 0],
        C: [0, 0, 0],
        F: 4,
        H: 'I',
        A: uriAction,
        QuadPoints: [
          linkX1, linkY2,
          linkX2, linkY2,
          linkX1, linkY1,
          linkX2, linkY1
        ],
      })
    );

    // Add the annotation to the page
    const annotations = page.node.lookup(PDFName.of('Annots'), PDFArray);
    if (annotations) {
      annotations.push(linkAnnotation);
    } else {
      page.node.set(PDFName.of('Annots'), context.obj([linkAnnotation]));
    }
  }
}


