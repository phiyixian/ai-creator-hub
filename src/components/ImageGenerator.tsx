'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GeneratedImage } from '@/lib/image-generator';
import { Loader2, Wand2, Download, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('photo');
  const [orientation, setOrientation] = useState<string>('landscape');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate images.");
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, style, orientation }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate images. Please try again.');
      }

      const data = await response.json();
      setImages(data.images);
      if (data.note) {
        setError(data.note);
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const filename = `${image.id}-${image.description.replace(/\s+/g, '-')}.jpg`;
      const downloadUrl = `/api/download/${filename}?url=${encodeURIComponent(image.downloadUrl)}&type=image`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download image.');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="w-6 h-6" /> AI Image Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Image Prompt</Label>
            <Input
              id="prompt"
              placeholder="e.g., A futuristic city at sunset"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="architecture">Architecture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select value={orientation} onValueChange={setOrientation} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Images
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Generation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {images.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Generated Images</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group overflow-hidden rounded-lg shadow-lg">
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image
                      src={img.url}
                      alt={img.description}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                    <p className="text-white text-sm text-center mb-2 line-clamp-2">{img.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(img)}
                      >
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && images.length === 0 && !error && (
          <div className="text-center text-gray-500">
            <p>Your generated images will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGenerator;