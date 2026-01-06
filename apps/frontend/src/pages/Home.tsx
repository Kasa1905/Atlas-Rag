import { Link } from 'react-router-dom';
import { FolderOpen, MessageSquare, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Atlas RAG
        </h1>
        <p className="text-lg text-gray-600">
          Your local document RAG system powered by Ollama embeddings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/projects"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
        >
          <FolderOpen className="w-12 h-12 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Projects
          </h2>
          <p className="text-gray-600">
            Organize your documents into projects for better management
          </p>
        </Link>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <MessageSquare className="w-12 h-12 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            RAG Chat
          </h2>
          <p className="text-gray-600">
            Ask questions about your documents with AI assistance
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <BookOpen className="w-12 h-12 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Local Embeddings
          </h2>
          <p className="text-gray-600">
            All embeddings are generated locally using Ollama
          </p>
        </div>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Getting Started
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Create a new project</li>
          <li>Upload your documents (PDF, code files, markdown)</li>
          <li>Wait for embeddings to be generated</li>
          <li>Start chatting with your documents!</li>
        </ol>
      </div>
    </div>
  );
}
