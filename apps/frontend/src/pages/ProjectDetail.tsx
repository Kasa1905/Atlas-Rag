import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, MessageSquare, Upload } from 'lucide-react';
import { FileUpload } from '../components/documents/FileUpload';
import { DocumentList } from '../components/documents/DocumentList';
import { ProjectSettings } from '../components/projects/ProjectSettings';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, documents, fetchProject, fetchDocuments, deleteDocument } = useProjectStore();

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchDocuments(id);
    }
  }, [id, fetchProject]);

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  const handleDeleteDocument = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(docId);
    }
  };

  const handleUpdateProject = (updatedProject) => {
    fetchProject(updatedProject.id);
  };

  const projectDocuments = documents[currentProject.id] || [];

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentProject.name}
          </h1>
          {currentProject.description && (
            <p className="text-gray-600 mt-2">{currentProject.description}</p>
          )}
        </div>

        <Link to={`/chat/${currentProject.id}`}>
          <Button>
            <MessageSquare className="w-4 h-4 mr-2" />
            Start Chat
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upload Documents</h2>
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <FileUpload projectId={currentProject.id} />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Documents</h2>
              <span className="text-sm text-gray-500">
                {projectDocuments.length} document{projectDocuments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <DocumentList
              documents={projectDocuments}
              onDelete={handleDeleteDocument}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <ProjectSettings 
            project={currentProject} 
            onUpdate={handleUpdateProject}
          />
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
