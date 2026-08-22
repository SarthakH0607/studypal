/**
 * SnapLearnPage — Upload screenshots, handwritten notes, diagrams or equations for Gemini Multimodal explanation.
 * Also allows generating educational visuals with Gemini Image Generation.
 */
import { useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Send, RefreshCw, Layers } from 'lucide-react';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useMediaCapture } from '../hooks/useMediaCapture';
import ReactMarkdown from 'react-markdown';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './SnapLearnPage.css';

export default function SnapLearnPage() {
  const { imageFile, imagePreview, fileInputRef, selectFile, handleFileChange, clearImage } = useMediaCapture();
  const [prompt, setPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  // Educational Visual Generation tab / state
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'generate'
  const [visualDescription, setVisualDescription] = useState('');
  const [visualContext, setVisualContext] = useState('');
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const handleAnalyze = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setAnalysisResult('');
    try {
      const res = await api.analyzeImage(imageFile, prompt);
      setAnalysisResult(res.explanation || 'No explanation received.');
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.message || 'Image analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateVisual = async (e) => {
    e.preventDefault();
    if (!visualDescription.trim()) return;

    setGeneratingVisual(true);
    setGeneratedImageUrl(null);
    try {
      const res = await api.generateVisual(visualDescription, visualContext);
      if (res.blob) {
        const url = URL.createObjectURL(res.blob);
        setGeneratedImageUrl(url);
        toast.success('Visual generated successfully!');
      } else {
        toast.error('Could not generate visual diagram');
      }
    } catch (err) {
      toast.error('Visual generation failed. Please try a simpler description.');
    } finally {
      setGeneratingVisual(false);
    }
  };

  return (
    <div className="page-enter">
      <Header title="Snap & Learn • Visual Intelligence" />
      <div className="snap-learn-page">
        {/* Mode Selector */}
        <div className="mode-toggle-bar">
          <button
            className={`mode-tab ${activeTab === 'analyze' ? 'mode-tab-active' : ''}`}
            onClick={() => setActiveTab('analyze')}
          >
            <Camera size={18} />
            <span>Image Understanding (Vision)</span>
          </button>
          <button
            className={`mode-tab ${activeTab === 'generate' ? 'mode-tab-active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <Sparkles size={18} />
            <span>Educational Visual Generator</span>
          </button>
        </div>

        {/* Tab 1: Image Understanding */}
        {activeTab === 'analyze' && (
          <div className="snap-grid">
            <Card className="snap-upload-card">
              <CardHeader>
                <CardTitle>Upload Photo / Notes / Equations</CardTitle>
                <Badge variant="primary">Gemini Multimodal</Badge>
              </CardHeader>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {!imagePreview ? (
                <div className="image-dropzone" onClick={selectFile}>
                  <Camera size={44} color="var(--color-primary)" />
                  <h4>Select or Capture Image</h4>
                  <p>Upload a screenshot of a homework problem, handwritten notes, or textbook diagram</p>
                  <Button variant="secondary" size="sm" onClick={selectFile}>
                    Choose Image File
                  </Button>
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Upload preview" className="preview-img" />
                  <div className="preview-controls">
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={clearImage}>
                      Change Image
                    </Button>
                  </div>
                </div>
              )}

              <div className="snap-prompt-area">
                <label className="label">Custom Question or Guidance (Optional)</label>
                <textarea
                  className="textarea"
                  placeholder="e.g. Solve step 3 of this equation, or explain the cycle shown in the diagram..."
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={analyzing}
                  disabled={!imageFile || analyzing}
                  icon={Sparkles}
                  onClick={handleAnalyze}
                >
                  Analyze & Explain
                </Button>
              </div>
            </Card>

            <Card className="snap-result-card">
              <CardHeader>
                <CardTitle>AI Tutor Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                {analyzing ? (
                  <div className="snap-analyzing-state">
                    <span className="btn-spinner" />
                    <p>Gemini Vision is inspecting your image, extracting equations and building structured steps...</p>
                  </div>
                ) : analysisResult ? (
                  <div className="markdown-content snap-markdown">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="snap-empty-result">
                    <ImageIcon size={48} color="var(--color-text-tertiary)" />
                    <h4>Ready to analyze</h4>
                    <p>Select an image on the left and click "Analyze & Explain" to get detailed step-by-step guidance.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Educational Visual Generation */}
        {activeTab === 'generate' && (
          <div className="snap-grid">
            <Card className="visual-form-card">
              <CardHeader>
                <CardTitle>Generate Concept Illustration</CardTitle>
                <Badge variant="secondary">Gemini Image Gen</Badge>
              </CardHeader>

              <form onSubmit={handleGenerateVisual} className="visual-form">
                <div className="auth-field">
                  <label className="label">Visual Description</label>
                  <textarea
                    className="textarea"
                    placeholder="e.g. Structure of a plant cell with labeled chloroplasts, vacuole, and cell wall"
                    rows={4}
                    value={visualDescription}
                    onChange={(e) => setVisualDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="label">Educational Context (Optional)</label>
                  <input
                    className="input"
                    placeholder="e.g. Grade 10 Biology, High School Geometry"
                    value={visualContext}
                    onChange={(e) => setVisualContext(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={generatingVisual}
                  disabled={!visualDescription.trim() || generatingVisual}
                  icon={Sparkles}
                >
                  Generate Educational Visual
                </Button>
              </form>
            </Card>

            <Card className="visual-display-card">
              <CardHeader>
                <CardTitle>Generated Educational Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                {generatingVisual ? (
                  <div className="snap-analyzing-state">
                    <span className="btn-spinner" />
                    <p>Generating high-fidelity educational visual...</p>
                  </div>
                ) : generatedImageUrl ? (
                  <div className="generated-image-box">
                    <img src={generatedImageUrl} alt="Generated visual" className="generated-img" />
                    <a href={generatedImageUrl} download="educational-diagram.png" className="download-btn">
                      <Button variant="secondary" size="sm">Download Image</Button>
                    </a>
                  </div>
                ) : (
                  <div className="snap-empty-result">
                    <Layers size={48} color="var(--color-text-tertiary)" />
                    <h4>No visual generated yet</h4>
                    <p>Describe an educational concept on the left to synthesize an illustrative diagram.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
