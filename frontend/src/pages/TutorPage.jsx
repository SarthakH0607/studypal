/**
 * TutorPage — AI chat with ChatGPT-like Previous Chats Sidebar, Voice & Visual support.
 */
import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Bot,
  Zap
} from 'lucide-react';
import Header from '../components/layout/Header';
import ChatPanel from '../components/tutor/ChatPanel';
import ChatInput from '../components/tutor/ChatInput';
import VoiceButton from '../components/tutor/VoiceButton';
import AudioPlayer from '../components/tutor/AudioPlayer';
import Button from '../components/ui/Button';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import './TutorPage.css';

export default function TutorPage() {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { isRecording, audioBlob, startRecording, stopRecording, clearRecording } = useVoiceRecorder();
  const { currentSessionId, setCurrentSessionId, activeSubject } = useStore();
  const bottomRef = useRef(null);

  // Load sessions list on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Process voice recording when blob is ready
  useEffect(() => {
    if (audioBlob && !voiceProcessing) {
      handleVoice();
    }
  }, [audioBlob]);

  const loadSessions = async () => {
    try {
      const res = await api.getChatSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === currentSessionId) return;
    setCurrentSessionId(sessionId);
    setLoadingHistory(true);
    try {
      const res = await api.getChatHistory(sessionId);
      setMessages(res.messages || []);
    } catch (err) {
      toast.error('Failed to load conversation');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setAudioUrl(null);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await api.deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      toast.success('Chat deleted');
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  const handleSend = async (message) => {
    const userMsg = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const data = await api.sendChat(message, currentSessionId, activeSubject);
      if (!currentSessionId && data.session_id) {
        setCurrentSessionId(data.session_id);
        loadSessions(); // Refresh list to include newly created session
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      toast.error('Failed to get response');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', sources: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = async () => {
    if (!audioBlob) return;
    setVoiceProcessing(true);
    try {
      const result = await api.sendVoice(audioBlob, currentSessionId, activeSubject);

      if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        setAudioUrl(url);
        const transcript = result.headers?.['x-transcript'] || 'Voice message';
        const responseText = result.headers?.['x-response-text'] || '';
        const returnedSessionId = result.headers?.['x-session-id'];

        if (returnedSessionId && !currentSessionId) {
          setCurrentSessionId(returnedSessionId);
        }

        setMessages((prev) => [
          ...prev,
          { role: 'user', content: `🎤 ${transcript}` },
          { role: 'assistant', content: responseText || '🔊 Audio response' },
        ]);
      } else {
        if (result.session_id && !currentSessionId) {
          setCurrentSessionId(result.session_id);
        }

        setMessages((prev) => [
          ...prev,
          { role: 'user', content: `🎤 ${result.transcript || 'Voice message'}` },
          { role: 'assistant', content: result.response || 'Audio response processed.' },
        ]);
      }
      loadSessions();
    } catch (err) {
      console.error('Voice processing error:', err);
      toast.error(err.message || 'Voice processing failed. Please try speaking again.');
    } finally {
      setVoiceProcessing(false);
      clearRecording();
    }
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-enter tutor-page-layout">
      <Header title="AI Tutor" />

      <div className="tutor-main-wrapper">
        {/* ChatGPT-style Previous Chats Sidebar */}
        <aside className={`tutor-history-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {sidebarOpen ? (
            <div className="tutor-history-content animate-fade-in">
              {/* Header with New Chat & Toggle */}
              <div className="tutor-history-header">
                <Button
                  variant="primary"
                  size="md"
                  className="new-chat-btn"
                  onClick={handleNewChat}
                >
                  <Plus size={18} /> New Chat
                </Button>
                <button
                  className="sidebar-collapse-btn"
                  onClick={() => setSidebarOpen(false)}
                  title="Close chats sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              {/* Search Previous Chats */}
              <div className="tutor-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search previous chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tutor-search-input"
                />
              </div>

              {/* Session List */}
              <div className="tutor-sessions-list">
                <div className="sessions-section-label">Previous Conversations</div>
                {filteredSessions.length === 0 ? (
                  <div className="empty-sessions">
                    <p>{searchQuery ? 'No chats found' : 'No previous chats yet'}</p>
                    <span>Start asking questions to build your history!</span>
                  </div>
                ) : (
                  filteredSessions.map((s) => {
                    const isActive = s.id === currentSessionId;
                    return (
                      <div
                        key={s.id}
                        className={`tutor-session-item ${isActive ? 'session-active' : ''}`}
                        onClick={() => handleSelectSession(s.id)}
                      >
                        <MessageSquare size={16} className="session-icon" />
                        <span className="session-title" title={s.title || 'Conversation'}>
                          {s.title || 'Conversation'}
                        </span>
                        <button
                          className="delete-session-btn"
                          title="Delete chat"
                          onClick={(e) => handleDeleteSession(e, s.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer info chip */}
              <div className="tutor-sidebar-footer">
                <div className="tutor-gemini-chip">
                  <Sparkles size={14} color="#7C3AED" />
                  <span>Gemini 3.6 Intelligence</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="tutor-history-collapsed">
              <button
                className="sidebar-expand-btn"
                onClick={() => setSidebarOpen(true)}
                title="Open previous chats"
              >
                <PanelLeftOpen size={20} />
              </button>
              <button
                className="collapsed-new-chat-btn"
                onClick={handleNewChat}
                title="New Chat"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </aside>

        {/* Chat Conversation Area */}
        <div className="tutor-chat-main">
          {/* Top Bar inside Chat window */}
          <div className="tutor-chat-top-header">
            {!sidebarOpen && (
              <button
                className="chat-header-toggle-btn"
                onClick={() => setSidebarOpen(true)}
                title="View previous chats"
              >
                <PanelLeftOpen size={18} />
                <span>Previous Chats</span>
              </button>
            )}
            <div className="active-session-indicator">
              <Bot size={18} color="var(--color-primary)" />
              <span>
                {currentSessionId
                  ? sessions.find((s) => s.id === currentSessionId)?.title || 'Current Chat'
                  : 'New Learning Session'}
              </span>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleNewChat}>
                <Plus size={14} /> New Chat
              </Button>
            )}
          </div>

          <div className="tutor-container">
            <div className="tutor-chat-area">
              <ChatPanel
                messages={messages}
                loading={loading || voiceProcessing || loadingHistory}
                onQuickAction={handleSend}
              />
              <div ref={bottomRef} />
            </div>

            {audioUrl && (
              <div className="tutor-audio-bar">
                <AudioPlayer audioUrl={audioUrl} autoPlay />
              </div>
            )}

            <div className="tutor-input-area">
              <VoiceButton
                isRecording={isRecording}
                isProcessing={voiceProcessing}
                onStart={startRecording}
                onStop={stopRecording}
              />
              <div className="tutor-input-flex">
                <ChatInput
                  onSend={handleSend}
                  disabled={loading || voiceProcessing || loadingHistory}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
