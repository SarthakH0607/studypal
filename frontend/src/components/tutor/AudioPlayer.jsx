/**
 * AudioPlayer — Plays TTS audio responses.
 */
import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import './AudioPlayer.css';

export default function AudioPlayer({ audioUrl, autoPlay = true }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl && autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }, [audioUrl, autoPlay]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (!audioUrl) return null;

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setPlaying(false)}
      />
      <button className={`audio-btn ${playing ? 'audio-playing' : ''}`} onClick={toggle}>
        {playing ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span>{playing ? 'Playing' : 'Play'}</span>
      </button>
    </div>
  );
}
