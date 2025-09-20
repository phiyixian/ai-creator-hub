'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GeneratedScript, ScriptScene } from '@/lib/script-generator';
import { Loader2, Wand2, FileText, Share2, Music, Mic, Tags, Target } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const ScriptGenerator = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [type, setType] = useState<string>('social');
  const [platform, setPlatform] = useState<string>('general');
  const [duration, setDuration] = useState<number>(60);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate a script.");
      return;
    }

    setLoading(true);
    setError(null);
    setScript(null);

    try {
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, type, platform, duration }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script. Please try again.');
      }

      const data = await response.json();
      setScript(data);
      if (data.fallback) {
        setError("Note: A fallback script was generated due to an error.");
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const renderScript = (script: GeneratedScript) => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{script.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Script</h4>
          <Separator className="my-2" />
          <div className="space-y-4">
            {script.scenes.map((scene, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-4 space-y-1">
                <p className="font-bold text-indigo-700">Scene {scene.sceneNumber} ({scene.duration}s)</p>
                <p><strong>Visuals:</strong> {scene.visual}</p>
                <p><strong>Voiceover:</strong> {scene.voiceover}</p>
                {scene.onScreenText && <p><strong>On-Screen Text:</strong> {scene.onScreenText}</p>}
                {scene.audio && <p><strong>Audio:</strong> {scene.audio}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold flex items-center gap-2"><Share2 className="w-4 h-4" /> Social Details</h4>
            <Separator className="my-2" />
            <div className="space-y-2 text-sm">
              <p><strong>Platform:</strong> <span className="capitalize">{script.platform}</span></p>
              <p><strong>Type:</strong> <span className="capitalize">{script.type}</span></p>
              <p><strong>Duration:</strong> {script.totalDuration}s</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold flex items-center gap-2"><Tags className="w-4 h-4" /> Hashtags</h4>
            <Separator className="my-2" />
            <p className="text-sm">{script.metadata.hashtags.join(' ')}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold flex items-center gap-2"><Music className="w-4 h-4" /> Music Suggestions</h4>
            <Separator className="my-2" />
            <ul className="list-disc list-inside text-sm space-y-1">
              {script.metadata.musicSuggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold flex items-center gap-2"><Mic className="w-4 h-4" /> Voiceover Notes</h4>
            <Separator className="my-2" />
            <ul className="list-disc list-inside text-sm space-y-1">
              {script.metadata.voiceoverNotes.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4" /> Audience</h4>
            <Separator className="my-2" />
            <p className="text-sm">{script.metadata.targetAudience}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" /> AI Script Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Script Topic</Label>
            <Input
              id="prompt"
              placeholder="e.g., A short history of the internet"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Script Type</Label>
              <Select value={type} onValueChange={setType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (s)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min={10}
                max={600}
                disabled={loading}
              />
            </div>
          </div>
          <Button onClick={handleGenerate} className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Script
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Script Generation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {script && renderScript(script)}

        {!loading && !script && !error && (
          <div className="text-center text-gray-500">
            <p>Your generated script will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScriptGenerator;