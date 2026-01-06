import { Document } from '@atlas/shared';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No documents yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Upload files to get started
        </p>
      </Card>
    );
  }

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center space-x-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center space-x-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" />
            <span>Completed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </div>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </h3>
                  {getStatusBadge(doc.status)}
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="uppercase">{doc.fileType}</span>
                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                  <span>{formatDate(doc.createdAt)}</span>
                </div>

                {doc.metadata && (
                  <div className="mt-2 text-xs text-gray-500">
                    {doc.metadata.pageCount && (
                      <span className="mr-3">
                        Pages: {doc.metadata.pageCount}
                      </span>
                    )}
                    {doc.metadata.chunkCount && (
                      <span>Chunks: {doc.metadata.chunkCount}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(doc.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
