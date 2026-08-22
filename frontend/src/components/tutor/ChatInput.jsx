/**
 * ChatInput — Text input with send button for AI tutor chat.
 */
import { useState } from 'react';
import { Send } from 'lucide-react';
import './ChatInput.css';

export default function ChatInput({ onSend, disabled = false, placeholder = 'Ask me anything...' }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!message.trim() || disabled}
          title="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
