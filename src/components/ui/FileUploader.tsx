// src/components/ui/FileUploader.tsx
"use client";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'video/*': [] } });

  return (
    <div
      {...getRootProps()}
      className="aspect-video rounded-lg overflow-hidden border-dashed border-2 grid place-items-center cursor-pointer transition-colors"
      style={{ borderColor: isDragActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
    >
      <input {...getInputProps()} />
      <div className="text-center text-sm text-[var(--muted-foreground)]">
        {fileName ? (
          <p>Selected file: **{fileName}**</p>
        ) : (
          isDragActive ? (
            <p>Drop the video file here ...</p>
          ) : (
            <p>Drop or select a clip</p>
          )
        )}
      </div>
    </div>
  );
}