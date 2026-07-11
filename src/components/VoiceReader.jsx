import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const VoiceReader = ({ textToRead }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert("Sorry, your browser doesn't support text to speech!");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <button 
      onClick={toggleVoice} 
      className="btn btn-outline" 
      aria-label="Read Plan Aloud"
      title="Read Aloud"
    >
      {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
      {isPlaying ? 'Stop' : 'Listen'}
    </button>
  );
};
