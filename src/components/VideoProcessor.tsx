'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Film, Image as ImageIcon, Ruler, Download, Play, Pause, Square, Scissors } from 'lucide-react';
import { VideoProcessor, VideoMetadata, ProcessingResult } from '@/lib/video-processor';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const videoProcessor = new VideoProcessor();

const VideoProcessorComponent = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [operation, setOperation] = useState<string>('trim');
  const [filter, setFilter] = useState<string>('vintage');
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0]);
  const [newDimensions, setNewDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [output, setOutput] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (file) {
      const processFile = async () => {
        setMetadata(null);
        setOutput(null);
        setLoading(true);
        setError(null);
        try {
          const meta = await videoProcessor.getVideoMetadata(file);
          setMetadata(meta);
          setTrimRange([0, meta.duration]);
          setNewDimensions({ width: meta.width, height: meta.height });
          if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(file);
          }
        } catch (err: any) {
          setError(err.message || "Failed to load video metadata.");
        } finally {
          setLoading(false);
        }
      };
      processFile();
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError("Please upload a video file first.");
      return;
    }

    setLoading(true);
    setOutput(null);
    setError(null);

    let result: ProcessingResult;
    try {
      switch (operation) {
        case 'trim':
          result = await videoProcessor.trimVideo(file, {
            startTime: trimRange[0],
            endTime: trimRange[1],
          });
          break;
        case 'filter':
          result = await videoProcessor.applyFilter(file, { filter });
          break;
        case 'resize':
          result = await videoProcessor.resizeVideo(file, {
            width: newDimensions.width,
            height: newDimensions.height,
          });
          break;
        case 'extract-audio':
          result = await videoProcessor.extractAudio(file);
          break;
        default:
          throw new Error('Unsupported operation selected.');
      }
      setOutput(result);
      if (!result.success) {
        setError(result.error || 'An unknown processing error occurred.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (output?.url) {
      const link = document.createElement('a');
      link.href = output.url;
      link.download = `processed-video-${Date.now()}.${operation === 'extract-audio' ? 'webm' : 'webm'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePlay = () => videoRef.current?.play();
  const handlePause = () => videoRef.current?.pause();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Film className="w-6 h-6" /> AI Video Processor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="video-upload">Upload Video</Label>
          <Input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} disabled={loading} />
        </div>

        {file && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Video Preview</h3>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-contain" controls />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Button size="sm" onClick={handlePlay}><Play className="w-4 h-4" /></Button>
                <Button size="sm" onClick={handlePause}><Pause className="w-4 h-4" /></Button>
              </div>
            </div>
            {metadata && (
              <div className="text-sm text-gray-600">
                <p><strong>Duration:</strong> {metadata.duration.toFixed(2)}s</p>
                <p><strong>Dimensions:</strong> {metadata.width}x{metadata.height}</p>
                <p><strong>Size:</strong> {(metadata.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Processing Operations</h3>
          <div className="space-y-2">
            <Label htmlFor="operation">Operation</Label>
            <Select value={operation} onValueChange={setOperation} disabled={loading || !file}>
              <SelectTrigger>
                <SelectValue placeholder="Select an operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trim">Trim Video</SelectItem>
                <SelectItem value="filter">Apply Filter</SelectItem>
                <SelectItem value="resize">Resize Video</SelectItem>
                <SelectItem value="extract-audio">Extract Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operation === 'trim' && metadata && (
            <div className="space-y-2">
              <Label>Trim Duration (s)</Label>
              <Slider
                value={trimRange}
                onValueChange={(value) => setTrimRange(value as [number, number])}
                max={metadata.duration}
                step={0.1}
                min={0}
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{trimRange[0].toFixed(2)}s</span>
                <span>{trimRange[1].toFixed(2)}s</span>
              </div>
            </div>
          )}

          {operation === 'filter' && (
            <div className="space-y-2">
              <Label htmlFor="filter">Filter</Label>
              <Select value={filter} onValueChange={setFilter} disabled={loading || !file}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="vintage">Vintage</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="grayscale">Grayscale</SelectItem>
                  <SelectItem value="sepia">Sepia</SelectItem>
                  <SelectItem value="blur">Blur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'resize' && metadata && (
            <div className="space-y-2">
              <Label>New Dimensions</Label>
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="Width"
                    value={newDimensions.width}
                    onChange={(e) => setNewDimensions({ ...newDimensions, width: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Height"
                    value={newDimensions.height}
                    onChange={(e) => setNewDimensions({ ...newDimensions, height: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          
          <Button onClick={handleProcess} className="w-full" disabled={loading || !file}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Film className="mr-2 h-4 w-4" />
            )}
            Process Video
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Processing Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {output?.success && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Processed Output</h3>
            {operation === 'extract-audio' ? (
              <audio controls src={output.url} className="w-full" />
            ) : (
              <video controls src={output.url} className="w-full rounded-lg" />
            )}
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download Processed File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoProcessorComponent;