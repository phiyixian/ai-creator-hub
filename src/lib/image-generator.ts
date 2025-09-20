// Image generation utilities using free services

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  author: string;
  authorUrl: string | null;
  downloadUrl: string;
  tags?: string[];
  color?: string;
}

export interface ImageGenerationOptions {
  style?: 'photo' | 'art' | 'abstract' | 'nature' | 'portrait' | 'architecture';
  orientation?: 'landscape' | 'portrait' | 'square';
  color?: string;
  count?: number;
  size?: 'small' | 'medium' | 'large';
}

export class ImageGenerator {
  private unsplashAccessKey: string | null = null;

  constructor(unsplashKey?: string) {
    this.unsplashAccessKey = unsplashKey || null;
  }

  async generateImages(prompt: string, options: ImageGenerationOptions = {}): Promise<GeneratedImage[]> {
    const {
      style = 'photo',
      orientation = 'landscape',
      color,
      count = 4,
      size = 'medium'
    } = options;

    try {
      // Try Unsplash first if API key is available
      if (this.unsplashAccessKey) {
        const unsplashImages = await this.generateWithUnsplash(prompt, { style, orientation, color, count });
        if (unsplashImages.length > 0) {
          return unsplashImages;
        }
      }

      // Fallback to placeholder services
      return this.generatePlaceholderImages(prompt, { style, orientation, color, count, size });

    } catch (error) {
      console.error('Image generation failed:', error);
      return this.generatePlaceholderImages(prompt, { style, orientation, color, count, size });
    }
  }

  private async generateWithUnsplash(
    prompt: string, 
    options: Pick<ImageGenerationOptions, 'style' | 'orientation' | 'color' | 'count'>
  ): Promise<GeneratedImage[]> {
    if (!this.unsplashAccessKey) return [];

    const { style, orientation, color, count } = options;
    const enhancedPrompt = this.enhancePromptForUnsplash(prompt, style, color);
    
    const params = new URLSearchParams({
      query: enhancedPrompt,
      count: count?.toString() || '4',
      orientation: orientation || 'landscape'
    });

    if (color) {
      params.set('color', color);
    }

    const response = await fetch(`https://api.unsplash.com/photos/random?${params}`, {
      headers: {
        'Authorization': `Client-ID ${this.unsplashAccessKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    const images = Array.isArray(data) ? data : [data];

    return images.map((img: any) => ({
      id: `unsplash-${img.id}`,
      url: img.urls.regular,
      thumbnail: img.urls.thumb,
      description: img.alt_description || prompt,
      author: img.user.name,
      authorUrl: img.user.links.html,
      downloadUrl: img.urls.full,
      tags: img.tags?.map((tag: any) => tag.title) || [],
      color: img.color
    }));
  }

  private generatePlaceholderImages(
    prompt: string, 
    options: ImageGenerationOptions
  ): GeneratedImage[] {
    const { style, orientation, color, count = 4, size } = options;
    const dimensions = this.getDimensions(orientation, size);
    const seed = this.generateSeed(prompt);

    const images: GeneratedImage[] = [];

    // Picsum Photos (Lorem Picsum)
    for (let i = 1; i <= Math.ceil(count / 2); i++) {
      images.push({
        id: `picsum-${seed}-${i}`,
        url: `https://picsum.photos/seed/${seed}-${i}/${dimensions.width}/${dimensions.height}`,
        thumbnail: `https://picsum.photos/seed/${seed}-${i}/300/200`,
        description: `Generated image: ${prompt} (variation ${i})`,
        author: 'AI Generated',
        authorUrl: null,
        downloadUrl: `https://picsum.photos/seed/${seed}-${i}/1920/1080`,
        tags: this.generateTags(prompt, style)
      });
    }

    // Placeholder.com with custom styling
    for (let i = Math.ceil(count / 2) + 1; i <= count; i++) {
      const bgColor = color ? color.replace('#', '') : this.getStyleColor(style);
      const textColor = this.getContrastColor(bgColor);
      const text = encodeURIComponent(prompt.slice(0, 20));

      images.push({
        id: `placeholder-${seed}-${i}`,
        url: `https://via.placeholder.com/${dimensions.width}x${dimensions.height}/${bgColor}/${textColor}?text=${text}`,
        thumbnail: `https://via.placeholder.com/300x200/${bgColor}/${textColor}?text=${encodeURIComponent(prompt.slice(0, 10))}`,
        description: `Styled generated image: ${prompt}`,
        author: 'AI Generated',
        authorUrl: null,
        downloadUrl: `https://via.placeholder.com/1920x1080/${bgColor}/${textColor}?text=${encodeURIComponent(prompt)}`,
        tags: this.generateTags(prompt, style),
        color: `#${bgColor}`
      });
    }

    return images.slice(0, count);
  }

  private enhancePromptForUnsplash(prompt: string, style?: string, color?: string): string {
    let enhancedPrompt = prompt;

    // Add style modifiers
    const styleModifiers: Record<string, string[]> = {
      photo: ['photography', 'professional', 'high-quality'],
      art: ['artistic', 'creative', 'digital art', 'painting'],
      abstract: ['abstract', 'modern', 'geometric', 'minimal'],
      nature: ['natural', 'outdoor', 'landscape', 'organic'],
      portrait: ['portrait', 'people', 'human', 'face'],
      architecture: ['architecture', 'building', 'urban', 'structure']
    };

    if (style && styleModifiers[style]) {
      const modifiers = styleModifiers[style];
      enhancedPrompt += ' ' + modifiers[Math.floor(Math.random() * modifiers.length)];
    }

    // Add color modifier
    if (color) {
      enhancedPrompt += ` ${color} color`;
    }

    return enhancedPrompt;
  }

  private generateSeed(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getDimensions(orientation?: string, size?: string): { width: number; height: number } {
    const sizeMods = {
      small: 0.5,
      medium: 1,
      large: 1.5
    };

    const mod = sizeMods[size as keyof typeof sizeMods] || 1;
    const baseWidth = Math.floor(800 * mod);
    const baseHeight = Math.floor(600 * mod);

    switch (orientation) {
      case 'portrait':
        return { width: baseHeight, height: baseWidth };
      case 'square':
        return { width: baseWidth, height: baseWidth };
      default:
        return { width: baseWidth, height: baseHeight };
    }
  }

  private getStyleColor(style?: string): string {
    const styleColors: Record<string, string> = {
      photo: '6366f1',
      art: 'a855f7',
      abstract: 'ec4899',
      nature: '10b981',
      portrait: 'f59e0b',
      architecture: '6b7280'
    };

    return styleColors[style || 'photo'] || '6366f1';
  }

  private getContrastColor(hexColor: string): string {
    // Simple contrast calculation
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '000000' : 'ffffff';
  }

  private generateTags(prompt: string, style?: string): string[] {
    const words = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const baseTags = words.slice(0, 3);
    
    const styleTags: Record<string, string[]> = {
      photo: ['photography', 'professional'],
      art: ['art', 'creative', 'design'],
      abstract: ['abstract', 'modern'],
      nature: ['nature', 'outdoor'],
      portrait: ['portrait', 'people'],
      architecture: ['architecture', 'building']
    };

    const additionalTags = styleTags[style || 'photo'] || ['generated', 'ai'];
    
    return [...baseTags, ...additionalTags].slice(0, 5);
  }
}

// Export a default instance
export const imageGenerator = new ImageGenerator();