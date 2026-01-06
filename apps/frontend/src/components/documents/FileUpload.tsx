import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../services/api';
import { useProjectStore } from '../../stores/projectStore';

interface FileUploadProps {
  projectId: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({ projectId }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addDocument } = useProjectStore();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const newUploads: UploadingFile[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'uploading',
    }));

    setUploadingFiles((prev) => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      try {
        const document = await uploadFile(projectId, upload.file);

        setUploadingFiles((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, progress: 100, status: 'success' }
              : u
          )
        );

        addDocument(document);

        // Remove from list after 2 seconds
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((u) => u.id !== upload.id));
        }, 2000);
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: 'error',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Upload failed',
                }
              : u
          )
        );
      }
    }
  };

  const removeUpload = (id: string) => {
    setUploadingFiles((prev) => prev.filter((u) => u.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      <Card
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, code files, and text documents (max 50MB)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.h,.hpp,.rs,.go,.rb,.php,.swift,.kt,.cs,.sh,.yaml,.yml,.json,.xml,.html,.css,.md,.txt"
        />
      </Card>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((upload) => (
            <Card key={upload.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {upload.status === 'uploading' && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {upload.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUpload(upload.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {upload.status === 'error' && upload.error && (
                <p className="mt-2 text-xs text-red-600">{upload.error}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
