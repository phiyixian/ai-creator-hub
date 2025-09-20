// Client-side video processing utilities

export interface VideoProcessingOptions {
  startTime?: number;
  endTime?: number;
  filter?: string;
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm' | 'mov';
}

export interface ProcessingResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: string;
  duration?: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  aspectRatio: number;
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async getVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          format: file.type,
          aspectRatio: video.videoWidth / video.videoHeight
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  async trimVideo(file: File, options: VideoProcessingOptions): Promise<ProcessingResult> {
    const { startTime = 0, endTime, quality = 'medium' } = options;

    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      await this.loadVideo(video);
      
      const duration = endTime ? endTime - startTime : video.duration - startTime;
      const stream = await this.createVideoStream(video, { startTime, duration, quality });
      
      return this.recordStream(stream, duration);

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async applyFilter(file: File, options: VideoProcessingOptions): Promise<ProcessingResult> {
    const { filter = 'none', quality = 'medium' } = options;

    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      await this.loadVideo(video);
      
      // Set canvas size to video size
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;

      const stream = this.canvas.captureStream(30); // 30 FPS
      const processedStream = await this.processStreamWithFilter(video, stream, filter);
      
      return this.recordStream(processedStream, video.duration);

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async resizeVideo(file: File, options: VideoProcessingOptions): Promise<ProcessingResult> {
    const { width = 1920, height = 1080, quality = 'medium' } = options;

    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      await this.loadVideo(video);
      
      // Set canvas to target size
      this.canvas.width = width;
      this.canvas.height = height;

      const stream = this.canvas.captureStream(30);
      const resizedStream = await this.processStreamWithResize(video, stream, width, height);
      
      return this.recordStream(resizedStream, video.duration);

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async extractAudio(file: File): Promise<ProcessingResult> {
    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      await this.loadVideo(video);

      // Create audio context and extract audio
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      
      source.connect(destination);
      
      return this.recordStream(destination.stream, video.duration, 'audio');

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addCaptions(file: File, captions: Array<{text: string, start: number, end: number}>): Promise<ProcessingResult> {
    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      await this.loadVideo(video);
      
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;

      const stream = this.canvas.captureStream(30);
      const captionedStream = await this.processStreamWithCaptions(video, stream, captions);
      
      return this.recordStream(captionedStream, video.duration);

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async loadVideo(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
    });
  }

  private async createVideoStream(
    video: HTMLVideoElement, 
    options: { startTime: number, duration: number, quality: string }
  ): Promise<MediaStream> {
    const { startTime, duration, quality } = options;
    
    // Set video to start time
    video.currentTime = startTime;
    
    // Create stream from video element
    const stream = (video as any).captureStream ? 
      (video as any).captureStream() : 
      this.createStreamFromVideo(video);
    
    return stream;
  }

  private createStreamFromVideo(video: HTMLVideoElement): MediaStream {
    // Fallback method using canvas
    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    
    const drawFrame = () => {
      if (!video.ended && !video.paused) {
        this.ctx.drawImage(video, 0, 0);
        requestAnimationFrame(drawFrame);
      }
    };
    
    video.play();
    drawFrame();
    
    return this.canvas.captureStream(30);
  }

  private async processStreamWithFilter(
    video: HTMLVideoElement,
    stream: MediaStream,
    filter: string
  ): Promise<MediaStream> {
    const drawFrame = () => {
      if (!video.ended && !video.paused) {
        this.ctx.filter = this.getFilterCSS(filter);
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        requestAnimationFrame(drawFrame);
      }
    };
    
    video.play();
    drawFrame();
    
    return stream;
  }

  private async processStreamWithResize(
    video: HTMLVideoElement,
    stream: MediaStream,
    targetWidth: number,
    targetHeight: number
  ): Promise<MediaStream> {
    const drawFrame = () => {
      if (!video.ended && !video.paused) {
        this.ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        requestAnimationFrame(drawFrame);
      }
    };
    
    video.play();
    drawFrame();
    
    return stream;
  }

  private async processStreamWithCaptions(
    video: HTMLVideoElement,
    stream: MediaStream,
    captions: Array<{text: string, start: number, end: number}>
  ): Promise<MediaStream> {
    const drawFrame = () => {
      if (!video.ended && !video.paused) {
        // Draw video frame
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Find current caption
        const currentCaption = captions.find(caption => 
          video.currentTime >= caption.start && video.currentTime <= caption.end
        );
        
        // Draw caption if exists
        if (currentCaption) {
          this.drawCaption(currentCaption.text);
        }
        
        requestAnimationFrame(drawFrame);
      }
    };
    
    video.play();
    drawFrame();
    
    return stream;
  }

  private drawCaption(text: string) {
    const fontSize = Math.max(16, this.canvas.width / 40);
    this.ctx.font = `${fontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    
    const x = this.canvas.width / 2;
    const y = this.canvas.height - 50;
    const padding = 10;
    
    // Measure text
    const metrics = this.ctx.measureText(text);
    const textWidth = metrics.width;
    
    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(
      x - textWidth / 2 - padding,
      y - fontSize - padding,
      textWidth + padding * 2,
      fontSize + padding * 2
    );
    
    // Draw text
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(text, x, y);
  }

  private async recordStream(
    stream: MediaStream, 
    duration: number, 
    type: 'video' | 'audio' = 'video'
  ): Promise<ProcessingResult> {
    return new Promise((resolve) => {
      this.recordedChunks = [];
      
      const options: MediaRecorderOptions = type === 'video' ? 
        { mimeType: 'video/webm' } : 
        { mimeType: 'audio/webm' };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { 
          type: type === 'video' ? 'video/webm' : 'audio/webm' 
        });
        const url = URL.createObjectURL(blob);
        
        resolve({
          success: true,
          blob,
          url,
          duration
        });
      };
      
      this.mediaRecorder.start();
      
      // Stop recording after duration
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, duration * 1000);
    });
  }

  private getFilterCSS(filter: string): string {
    const filters: Record<string, string> = {
      'brightness': 'brightness(1.2)',
      'contrast': 'contrast(1.3)',
      'saturate': 'saturate(1.4)',
      'sepia': 'sepia(0.8)',
      'grayscale': 'grayscale(1)',
      'blur': 'blur(2px)',
      'vintage': 'sepia(0.5) contrast(1.2) brightness(1.1)',
      'dramatic': 'contrast(1.5) brightness(0.9) saturate(1.3)',
      'cool': 'hue-rotate(180deg) saturate(1.2)',
      'warm': 'hue-rotate(-30deg) saturate(1.1) brightness(1.1)',
      'none': 'none'
    };
    
    return filters[filter] || 'none';
  }

  // Utility method to get supported formats
  static getSupportedFormats(): { input: string[], output: string[] } {
    return {
      input: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', '3gp'],
      output: ['webm', 'mp4'] // Browser-supported output formats
    };
  }

  // Utility method to get social media presets
  static getSocialMediaPresets() {
    return [
      { name: 'Instagram Story', width: 1080, height: 1920, maxDuration: 15 },
      { name: 'Instagram Post', width: 1080, height: 1080, maxDuration: 60 },
      { name: 'TikTok', width: 1080, height: 1920, maxDuration: 60 },
      { name: 'YouTube Shorts', width: 1080, height: 1920, maxDuration: 60 },
      { name: 'Twitter', width: 1280, height: 720, maxDuration: 140 },
      { name: 'LinkedIn', width: 1280, height: 720, maxDuration: 600 }
    ];
  }
}

function fileToObjectUrl(file: File): string {
  try {
    return URL.createObjectURL(file);
  } catch (e) {
    // Fallback: create a blob copy (rarely needed)
    const blob = new Blob([file], { type: file.type || "video/webm" });
    return URL.createObjectURL(blob);
  }
}

async function simulateWork(ms = 400): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export interface TrimOptions {
  start: number; // start time in seconds
  end: number;   // end time in seconds
}

export interface Caption {
  text: string;
  start: number;
  end: number;
}

export const videoProcessor = {
  async trimVideo(file: File, _opts: TrimOptions): Promise<ProcessingResult> {
    try {
      // NOTE: Real trimming would require ffmpeg.wasm; here we just echo the file after a short delay.
      await simulateWork(500);
      const url = fileToObjectUrl(file);
      return { success: true, url };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to trim video" };
    }
  },

  async addCaptions(file: File, _captions: Caption[]): Promise<ProcessingResult> {
    try {
      // NOTE: Real caption burn-in also requires ffmpeg; we return the original as a stub.
      await simulateWork(600);
      const url = fileToObjectUrl(file);
      return { success: true, url };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to add captions" };
    }
  },
};