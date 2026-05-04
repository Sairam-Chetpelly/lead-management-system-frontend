import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class WatermarkService {
  private static logoDataUrl: string | null = null;

  // Load logo once and cache it
  private static async loadLogo(): Promise<string | null> {
    if (this.logoDataUrl) return this.logoDataUrl;
    
    try {
      // Try to load logo from public assets
      const response = await fetch('/assets/logo.png');
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.warn('Logo not found, using text watermark');
    }
    return null;
  }

  // Add watermark to image files
  static async addImageWatermark(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx!.drawImage(img, 0, 0);
        
        // Try to add logo watermark
        const logoDataUrl = await this.loadLogo();
        
        if (logoDataUrl) {
          const logo = new Image();
          logo.onload = () => {
            // Calculate logo size (40% of smallest dimension)
            const logoSize = Math.min(img.width, img.height) * 0.4;
            const aspectRatio = logo.width / logo.height;
            const logoWidth = logoSize;
            const logoHeight = logoSize / aspectRatio;
            
            // Center the logo
            const x = (img.width - logoWidth) / 2;
            const y = (img.height - logoHeight) / 2;
            
            // Set opacity and draw logo
            ctx!.globalAlpha = 0.3;
            ctx!.drawImage(logo, x, y, logoWidth, logoHeight);
            
            // Convert back to file
            canvas.toBlob((blob) => {
              if (blob) {
                const watermarkedFile = new File([blob], file.name, { type: file.type });
                resolve(watermarkedFile);
              } else {
                reject(new Error('Failed to create watermarked image'));
              }
            }, file.type, 0.9);
          };
          logo.src = logoDataUrl;
        } else {
          // Fallback to text watermark
          this.addTextWatermarkToCanvas(ctx!, img.width, img.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, { type: file.type });
              resolve(watermarkedFile);
            } else {
              reject(new Error('Failed to create watermarked image'));
            }
          }, file.type, 0.9);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Add text watermark to canvas
  private static addTextWatermarkToCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const text = 'REMINISCENT';
    const fontSize = Math.min(width, height) * 0.08;
    
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Center the text
    ctx.fillText(text, width / 2, height / 2);
  }

  // Add watermark to PDF files
  static async addPdfWatermark(file: File): Promise<File> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      // Try to add logo watermark
      const logoDataUrl = await this.loadLogo();
      
      if (logoDataUrl) {
        // Convert data URL to bytes
        const logoResponse = await fetch(logoDataUrl);
        const logoBytes = await logoResponse.arrayBuffer();
        const logoImage = await pdfDoc.embedPng(logoBytes);
        
        const logoScale = 0.3;
        const logoDims = logoImage.scale(logoScale);

        for (const page of pages) {
          const { width, height } = page.getSize();
          const centerX = (width - logoDims.width) / 2;
          const centerY = (height - logoDims.height) / 2;
          
          page.drawImage(logoImage, {
            x: centerX,
            y: centerY,
            width: logoDims.width,
            height: logoDims.height,
            opacity: 0.15
          });
        }
      } else {
        // Fallback to text watermark
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const watermarkText = 'REMINISCENT';

        for (const page of pages) {
          const { width, height } = page.getSize();
          const fontSize = 80;
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          
          page.drawText(watermarkText, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
            opacity: 0.15
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      return new File([new Uint8Array(pdfBytes)], file.name, { type: 'application/pdf' });
    } catch (error) {
      console.error('PDF watermark failed:', error);
      throw new Error(`PDF watermark failed: ${error}`);
    }
  }

  // Main watermark function
  static async addWatermark(file: File): Promise<File> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Check if it's an image
    if (fileType.startsWith('image/') || 
        fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
        fileName.endsWith('.png') || fileName.endsWith('.webp') || 
        fileName.endsWith('.gif') || fileName.endsWith('.bmp')) {
      return await this.addImageWatermark(file);
    }
    
    // Check if it's a PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.addPdfWatermark(file);
    }
    
    // Return original file for unsupported types
    return file;
  }

  // Check if file type supports watermarking
  static supportsWatermark(file: File): boolean {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    return fileType.startsWith('image/') || 
           fileType === 'application/pdf' ||
           fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
           fileName.endsWith('.png') || fileName.endsWith('.webp') || 
           fileName.endsWith('.gif') || fileName.endsWith('.bmp') ||
           fileName.endsWith('.pdf');
  }
}

export const watermarkService = WatermarkService;