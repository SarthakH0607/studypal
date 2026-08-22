/**
 * ChatPanel — Chat message area with StudyPal gamified bubbles, quick-actions & grounded textbook citations.
 */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Sparkles, Lightbulb, Image as ImageIcon, Volume2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import './ChatPanel.css';

export default function ChatPanel({ messages = [], loading = false, onQuickAction }) {
  const [expandedCitationIndex, setExpandedCitationIndex] = useState(null);

  const quickActions = [
    { label: 'Super Simple', icon: Sparkles, prompt: 'Can you explain that in super simple terms like I am 10?' },
    { label: 'Give Example', icon: Lightbulb, prompt: 'Can you give me a real-world example of this?' },
    { label: 'Show Picture', icon: ImageIcon, prompt: 'Can you generate an educational diagram/picture for this?' },
    { label: 'Explain With Voice', icon: Volume2, prompt: 'Can you summarize this in a short spoken script?' },
  ];

  const toggleCitation = (index) => {
    setExpandedCitationIndex(prev => prev === index ? null : index);
  };

  return (
    <div className="chat-panel">
      {messages.length === 0 && !loading && (
        <div className="chat-empty">
          <div className="chat-empty-icon animate-bounce">
            <Bot size={44} />
          </div>
          <h3>Meet Your Grounded AI Learning Buddy! 📚</h3>
          <p>Ask anything about math, biology, physics, or chemistry. All explanations are retrieved from verified open curriculum textbooks with citations!</p>
          <div className="chat-empty-suggestions">
            <button
              className="suggestion-pill"
              onClick={() => onQuickAction && onQuickAction('Explain Photosynthesis light and dark reactions')}
            >
              🌱 Photosynthesis Reactions
            </button>
            <button
              className="suggestion-pill"
              onClick={() => onQuickAction && onQuickAction('How do we solve quadratic equations using the discriminant?')}
            >
              📐 Quadratic Discriminant
            </button>
            <button
              className="suggestion-pill"
              onClick={() => onQuickAction && onQuickAction('Explain Newton\'s 3rd Law with action-reaction pairs')}
            >
              🚀 Newton's 3rd Law
            </button>
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isAssistant = msg.role === 'assistant';
        const isLastAssistant = isAssistant && (i === messages.length - 1 || (i === messages.length - 2 && messages[i+1]?.role === 'user'));
        const sources = msg.sources || [];

        return (
          <div
            key={msg.id || i}
            className={`chat-message chat-message-${msg.role} animate-fade-in-up`}
          >
            <div className="chat-avatar">
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="chat-bubble-container">
              <div className="chat-bubble">
                {isAssistant ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {/* Grounded Textbook Citation Box */}
              {isAssistant && sources.length > 0 && (
                <div className="citation-container">
                  {sources.map((src, sIdx) => {
                    const isExpanded = expandedCitationIndex === `${i}-${sIdx}`;
                    return (
                      <div key={sIdx} className="citation-badge-wrapper">
                        <button
                          className="citation-toggle-btn"
                          onClick={() => toggleCitation(`${i}-${sIdx}`)}
                        >
                          <BookOpen size={13} color="var(--color-primary)" />
                          <span className="citation-title">Source: {src.source}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {isExpanded && (
                          <div className="citation-excerpt-card animate-fade-in">
                            <div className="excerpt-header">
                              <strong>{src.topic}</strong>
                              <span className="concept-tag-badge">{src.concept_tag}</span>
                            </div>
                            <p className="excerpt-text">"{src.excerpt}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick-action pills below AI response */}
              {isLastAssistant && !loading && onQuickAction && (
                <div className="quick-action-pills">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      className="quick-action-btn"
                      onClick={() => onQuickAction(qa.prompt)}
                    >
                      <qa.icon size={13} />
                      <span>{qa.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="chat-message chat-message-assistant animate-fade-in-up">
          <div className="chat-avatar"><Bot size={18} /></div>
          <div className="chat-bubble-container">
            <div className="chat-bubble">
              <div className="chat-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
