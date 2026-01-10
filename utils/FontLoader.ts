// utils/FontLoader.ts
export class FontLoader {
  private static fontsCache = new Map<string, string>();

  // Fetch font from public folder
  static async loadFont(fontName: string): Promise<string> {
    // Check cache first
    if (this.fontsCache.has(fontName)) {
      return this.fontsCache.get(fontName)!;
    }

    try {
      // Determine font URL based on environment
      const fontUrl = this.getFontUrl(fontName);
      console.log(`📥 Loading font: ${fontUrl}`);

      // Fetch font file
      const response = await fetch(fontUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch font: ${response.statusText}`);
      }

      // Convert to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64String = this.arrayBufferToBase64(arrayBuffer);

      // Cache the font
      this.fontsCache.set(fontName, base64String);
      
      console.log(`✅ Font loaded: ${fontName} (${base64String.length} bytes)`);
      return base64String;

    } catch (error) {
      console.error(`❌ Error loading font ${fontName}:`, error);
      throw error;
    }
  }

  // Get font URL for different environments
  private static getFontUrl(fontName: string): string {
    // For local development
    if (process.env.NODE_ENV === 'development') {
      return `/fonts/${fontName}`;
    }

    // For Vercel/Production - adjust based on your base URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/fonts/${fontName}`;
  }

  // Convert ArrayBuffer to base64
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Preload all required fonts
  static async preloadFonts(): Promise<void> {
    const fontsToLoad = [
      'NotoSansDevanagari-Regular.ttf',
      'NotoSansDevanagari-Bold.ttf'
    ];

    try {
      await Promise.all(fontsToLoad.map(font => this.loadFont(font)));
      console.log('✅ All fonts preloaded successfully');
    } catch (error) {
      console.warn('⚠️ Some fonts failed to preload:', error);
    }
  }
}
