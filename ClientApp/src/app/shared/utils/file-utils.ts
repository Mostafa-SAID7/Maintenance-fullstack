export class FileUtils {
  /**
   * Formats file size to human readable format
   */
  static formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Gets file extension from filename
   */
  static getFileExtension(filename: string): string {
    if (!filename || filename.indexOf('.') === -1) return '';
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Gets filename without extension
   */
  static getFileName(filename: string): string {
    if (!filename || filename.indexOf('.') === -1) return filename;
    return filename.slice(0, filename.lastIndexOf('.'));
  }

  /**
   * Validates file type by MIME type
   */
  static isValidFileType(file: File, allowedTypes: string[]): boolean {
    if (!file || !allowedTypes.length) return false;
    return allowedTypes.some(type => file.type.startsWith(type));
  }

  /**
   * Validates file size
   */
  static isValidFileSize(file: File, maxSizeInMB: number): boolean {
    if (!file) return false;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  /**
   * Creates a download link for a file
   */
  static downloadFile(file: File, filename?: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Reads file as text
   */
  static readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Reads file as data URL
   */
  static readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Reads file as binary string
   */
  static readAsBinaryString(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }

  /**
   * Reads file as ArrayBuffer
   */
  static readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Gets file icon based on MIME type
   */
  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'fas fa-file-image';
    if (mimeType.startsWith('video/')) return 'fas fa-file-video';
    if (mimeType.startsWith('audio/')) return 'fas fa-file-audio';
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'fas fa-file-archive';
    if (mimeType.includes('text')) return 'fas fa-file-alt';
    if (mimeType.includes('json')) return 'fas fa-file-code';
    return 'fas fa-file';
  }

  /**
   * Checks if file is an image
   */
  static isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Checks if file is a video
   */
  static isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  /**
   * Checks if file is audio
   */
  static isAudio(file: File): boolean {
    return file.type.startsWith('audio/');
  }

  /**
   * Checks if file is a document
   */
  static isDocument(file: File): boolean {
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/rtf'
    ];
    return docTypes.includes(file.type);
  }

  /**
   * Compresses an image file
   */
  static compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!this.isImage(file)) {
        reject(new Error('File is not an image'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generates a unique filename
   */
  static generateUniqueFilename(originalName: string, separator: string = '-'): string {
    const extension = this.getFileExtension(originalName);
    const name = this.getFileName(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    if (extension) {
      return `${name}${separator}${timestamp}${separator}${random}.${extension}`;
    }
    return `${name}${separator}${timestamp}${separator}${random}`;
  }

  /**
   * Validates filename (removes invalid characters)
   */
  static sanitizeFilename(filename: string): string {
    // Remove invalid characters for Windows/Mac/Linux
    return filename.replace(/[<>:"/\\|?*]/g, '_');
  }

  /**
   * Checks if filename is safe
   */
  static isSafeFilename(filename: string): boolean {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /\.\./, // Path traversal
      /\//,   // Forward slash
      /\\/,   // Backslash
      /^con$/i, /^prn$/i, /^aux$/i, /^nul$/i, /^com[1-9]$/i, /^lpt[1-9]$/i, // Windows reserved names
      /^\./,  // Starting with dot
      /\.$/   // Ending with dot
    ];

    return !dangerousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Gets MIME type from extension
   */
  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Converts file to base64
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:[type];base64, prefix if present
        const base64 = result.replace(/^data:.*,/, '');
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Converts base64 to file
   */
  static base64ToFile(base64: string, filename: string, mimeType: string): File {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  }
}