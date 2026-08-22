/**
 * useVoiceRecorder — Browser MediaRecorder for push-to-talk voice input.
 * Returns a WAV-compatible blob for backend transcription.
 */
import { useState, useRef, useCallback } from 'react';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100); // collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    chunksRef.current = [];
  }, []);

  return { isRecording, audioBlob, startRecording, stopRecording, clearRecording };
}
