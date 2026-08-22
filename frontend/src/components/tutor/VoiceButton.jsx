/**
 * VoiceButton — Push-to-talk button for voice tutoring.
 */
import { Mic, MicOff, Loader2 } from 'lucide-react';
import './VoiceButton.css';

export default function VoiceButton({ isRecording, isProcessing, onStart, onStop }) {
  const handleClick = () => {
    if (isProcessing) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button
      className={`voice-btn ${isRecording ? 'voice-btn-recording' : ''} ${isProcessing ? 'voice-btn-processing' : ''}`}
      onClick={handleClick}
      disabled={isProcessing}
      title={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      {isProcessing ? (
        <Loader2 size={20} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={20} />
      ) : (
        <Mic size={20} />
      )}
      {isRecording && <span className="voice-pulse" />}
    </button>
  );
}
