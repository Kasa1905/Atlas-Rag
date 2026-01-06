import { useState } from 'react';
import { Project } from '@atlas/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Save, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ProjectSettingsProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

export function ProjectSettings({ project, onUpdate }: ProjectSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    chunkSize: project.settings.chunkSize,
    chunkOverlap: project.settings.chunkOverlap,
    embeddingModel: project.settings.embeddingModel,
    chatModel: project.settings.chatModel,
    watchedDirectory: project.settings.watchedDirectory || '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (formData.chunkSize < 100 || formData.chunkSize > 5000) {
      setError('Chunk size must be between 100 and 5000');
      return false;
    }
    if (formData.chunkOverlap < 0 || formData.chunkOverlap >= formData.chunkSize) {
      setError('Chunk overlap must be less than chunk size');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await api.patch<Project>(`/api/projects/${project.id}`, {
        settings: {
          chunkSize: formData.chunkSize,
          chunkOverlap: formData.chunkOverlap,
          embeddingModel: formData.embeddingModel,
          chatModel: formData.chatModel,
          watchedDirectory: formData.watchedDirectory || undefined,
        },
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update settings');
      }

      onUpdate(response.data);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      chunkSize: project.settings.chunkSize,
      chunkOverlap: project.settings.chunkOverlap,
      embeddingModel: project.settings.embeddingModel,
      chatModel: project.settings.chatModel,
      watchedDirectory: project.settings.watchedDirectory || '',
    });
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Chunk Size:</span>
            <p className="text-gray-600">{project.settings.chunkSize} tokens</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Chunk Overlap:</span>
            <p className="text-gray-600">{project.settings.chunkOverlap} tokens</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Embedding Model:</span>
            <p className="text-gray-600">{project.settings.embeddingModel}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Chat Model:</span>
            <p className="text-gray-600">{project.settings.chatModel}</p>
          </div>
          {project.settings.watchedDirectory && (
            <div>
              <span className="font-medium text-gray-700">
                Watched Directory:
              </span>
              <p className="text-gray-600 truncate">
                {project.settings.watchedDirectory}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Edit Settings</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chunk Size (100-5000)
          </label>
          <Input
            type="number"
            min="100"
            max="5000"
            value={formData.chunkSize}
            onChange={(e) =>
              handleInputChange('chunkSize', parseInt(e.target.value) || 0)
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Number of tokens per chunk
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chunk Overlap
          </label>
          <Input
            type="number"
            min="0"
            max={formData.chunkSize - 1}
            value={formData.chunkOverlap}
            onChange={(e) =>
              handleInputChange('chunkOverlap', parseInt(e.target.value) || 0)
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Overlap between chunks in tokens
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Embedding Model
          </label>
          <Input
            type="text"
            value={formData.embeddingModel}
            onChange={(e) =>
              handleInputChange('embeddingModel', e.target.value)
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Model used for embeddings
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chat Model
          </label>
          <Input
            type="text"
            value={formData.chatModel}
            onChange={(e) =>
              handleInputChange('chatModel', e.target.value)
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Model used for chat responses
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Watched Directory (Optional)
          </label>
          <Input
            type="text"
            placeholder="/path/to/documents"
            value={formData.watchedDirectory}
            onChange={(e) =>
              handleInputChange('watchedDirectory', e.target.value)
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Directory to automatically watch for new files
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
}
