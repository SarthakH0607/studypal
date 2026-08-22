/**
 * DocumentsPage — Upload study materials, PDFs, notes for semantic RAG Q&A.
 */
import { useState, useEffect, useRef } from 'react';
import { FileText, UploadCloud, Trash2, Send, BookOpen, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Loader';
import ReactMarkdown from 'react-markdown';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './DocumentsPage.css';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [ragHistory, setRagHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.listDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadDocument(file);
      toast.success(`${file.name} uploaded and vectorized!`);
      loadDocuments();
    } catch (err) {
      toast.error(err.message || 'Failed to upload and index document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId, name) => {
    if (!window.confirm(`Delete ${name}? This will remove all indexed vector embeddings.`)) return;
    try {
      await api.deleteDocument(docId);
      toast.success('Document deleted');
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleRagQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || querying) return;

    const userQuestion = query.trim();
    setQuery('');
    setQuerying(true);

    // Optimistically add user question
    const queryId = Date.now();
    setRagHistory((prev) => [
      ...prev,
      { id: queryId, question: userQuestion, answer: null, sources: [], loading: true },
    ]);

    try {
      const res = await api.queryDocuments(userQuestion);
      setRagHistory((prev) =>
        prev.map((item) =>
          item.id === queryId
            ? { ...item, answer: res.answer, sources: res.sources || [], loading: false }
            : item
        )
      );
    } catch (err) {
      toast.error('Failed to retrieve answer');
      setRagHistory((prev) =>
        prev.map((item) =>
          item.id === queryId
            ? { ...item, answer: 'Sorry, I encountered an error searching your documents.', loading: false }
            : item
        )
      );
    } finally {
      setQuerying(false);
    }
  };

  if (loading) return <PageLoader text="Loading your study library..." />;

  return (
    <div className="page-enter">
      <Header title="Study Documents & RAG" />
      <div className="documents-page">
        {/* Left column: Upload & Document Library */}
        <div className="docs-sidebar">
          <Card className="upload-card">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt,.md"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div
              className="dropzone"
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <UploadCloud size={36} color="var(--color-primary)" />
              <h4>{uploading ? 'Processing & Vectorizing...' : 'Upload PDF or Text'}</h4>
              <p>Drag and drop or click to ingest into BGE-M3 vector store</p>
              <Button
                variant="primary"
                size="sm"
                loading={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose File
              </Button>
            </div>
          </Card>

          <Card className="library-card">
            <CardHeader>
              <CardTitle>Ingested Library ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="empty-text">No documents yet. Upload a syllabus, textbook chapter, or class notes to start asking questions.</p>
              ) : (
                <div className="doc-items-list">
                  {documents.map((doc) => (
                    <div key={doc.id} className="doc-item">
                      <div className="doc-item-icon">
                        <FileText size={18} />
                      </div>
                      <div className="doc-item-info">
                        <span className="doc-name" title={doc.filename}>{doc.filename}</span>
                        <span className="doc-meta">
                          {doc.total_chunks ? `${doc.total_chunks} chunks` : 'Processing'} • {(doc.file_size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        className="doc-delete-btn"
                        title="Delete document"
                        onClick={() => handleDelete(doc.id, doc.filename)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Grounded RAG Chat */}
        <div className="docs-chat-section">
          <Card className="rag-chat-card">
            <CardHeader>
              <div className="rag-header-title">
                <Sparkles size={18} color="var(--color-secondary)" />
                <CardTitle>Grounded Document Q&A</CardTitle>
              </div>
              <Badge variant="info">BGE-M3 + Supabase pgvector</Badge>
            </CardHeader>

            <div className="rag-messages-area">
              {ragHistory.length === 0 ? (
                <div className="rag-empty">
                  <BookOpen size={48} color="var(--color-text-tertiary)" />
                  <h3>Ask Questions Grounded in Your Notes</h3>
                  <p>
                    OOSC uses BGE-M3 embeddings and vector similarity search to find exact passages from your uploaded documents and answer with Gemini.
                  </p>
                </div>
              ) : (
                <div className="rag-qa-list">
                  {ragHistory.map((item) => (
                    <div key={item.id} className="rag-qa-item animate-fade-in-up">
                      <div className="rag-question">
                        <strong>Q:</strong> {item.question}
                      </div>

                      <div className="rag-answer">
                        {item.loading ? (
                          <div className="rag-loading-state">
                            <span className="btn-spinner" />
                            <span>Retrieving vector chunks and grounding answer...</span>
                          </div>
                        ) : (
                          <>
                            <div className="markdown-content">
                              <ReactMarkdown>{item.answer}</ReactMarkdown>
                            </div>

                            {item.sources && item.sources.length > 0 && (
                              <div className="rag-sources">
                                <span className="sources-title">Referenced Context Chunks:</span>
                                <div className="sources-chips">
                                  {item.sources.map((src, sIdx) => (
                                    <div key={sIdx} className="source-chip" title={src.content}>
                                      <span>Chunk #{src.chunk_index + 1}</span>
                                      <Badge variant="primary" size="sm">{(src.similarity * 100).toFixed(0)}% match</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form className="rag-input-bar" onSubmit={handleRagQuery}>
              <input
                className="input"
                placeholder={documents.length === 0 ? 'Upload a document first to enable grounded Q&A...' : 'Ask a question about your uploaded materials...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={querying || documents.length === 0}
              />
              <Button
                type="submit"
                variant="primary"
                icon={Send}
                loading={querying}
                disabled={!query.trim() || documents.length === 0}
              >
                Search & Ask
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
