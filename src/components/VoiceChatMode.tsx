import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Loader2, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatService } from '../services/chatService';
import { fetchWithAuth } from '../services/api';
import toast from 'react-hot-toast';

interface VoiceChatModeProps {
  conversationId: string | null;
  onClose: () => void;
}

export default function VoiceChatMode({ conversationId, onClose }: VoiceChatModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const synth = window.speechSynthesis;

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
      synth.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(1000); // chunk every second
      setIsListening(true);
    } catch {
      toast.error('Microphone access denied or unavailable.');
    }
  };

  const processAudio = async (blob: Blob) => {
    try {
      // 1. Transcribe
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      const response = await fetchWithAuth('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Transcription failed');
      const data = await response.json();
      const text = data.text;
      
      if (!text || text.trim().length === 0) {
        setIsProcessing(false);
        return;
      }
      
      setTranscript(text);

      // 2. Chat completion
      setAiResponse('');
      let fullResponse = '';
      
      await chatService.streamMessage(
        conversationId,
        text,
        false,
        '', // default model
        undefined, undefined, undefined,
        (chunk) => {
          if (chunk.c) {
            fullResponse += chunk.c;
            setAiResponse(prev => prev + chunk.c);
          }
        },
        () => {
          setIsProcessing(false);
          speakResponse(fullResponse);
        },
        () => {
          setIsProcessing(false);
          toast.error('AI response failed');
        }
      );
    } catch {
      setIsProcessing(false);
      toast.error('Processing error');
    }
  };

  const speakResponse = (text: string) => {
    if (!text) return;
    
    // Clean text for speech
    const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[`*#_~>]/g, '').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const aiVoiceURI = localStorage.getItem('aiVoice');
    if (aiVoiceURI) {
      const voices = synth.getVoices();
      const voice = voices.find(v => v.voiceURI === aiVoiceURI);
      if (voice) utterance.voice = voice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto resume listening after speaking
      startRecording();
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    synth.speak(utterance);
  };

  const toggleVoiceMode = () => {
    if (isListening) {
      stopRecording();
    } else {
      if (isSpeaking) {
        synth.cancel();
        setIsSpeaking(false);
      }
      startRecording();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-lg animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors">
        <X size={24} />
      </button>

      <div className="flex flex-col items-center justify-center w-full max-w-2xl px-6 text-center space-y-12">
        
        <div className="relative group cursor-pointer" onClick={toggleVoiceMode}>
          <div className={cn(
            "absolute inset-0 rounded-full blur-3xl opacity-50 transition-all duration-1000",
            isListening ? "bg-red-500 scale-150 animate-pulse" : 
            isSpeaking ? "bg-primary scale-125 animate-pulse" : 
            isProcessing ? "bg-blue-500 scale-110 animate-pulse" : "bg-primary/20 scale-100"
          )} />
          
          <div className={cn(
            "relative flex items-center justify-center w-32 h-32 rounded-full shadow-2xl transition-all duration-500 border-4 border-background",
            isListening ? "bg-red-500 scale-110" : 
            isSpeaking ? "bg-primary scale-105" : 
            "bg-secondary/80 hover:bg-secondary"
          )}>
            {isProcessing ? (
              <Loader2 size={48} className="text-white animate-spin" />
            ) : isSpeaking ? (
              <Volume2 size={48} className="text-white animate-pulse" />
            ) : isListening ? (
              <Mic size={48} className="text-white animate-pulse" />
            ) : (
              <MicOff size={48} className="text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          <p className="text-lg font-medium text-muted-foreground min-h-8">
            {isListening ? "Listening..." : isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : "Tap microphone to start"}
          </p>
          
          <div className="space-y-6">
            {transcript && (
              <div className="text-xl font-medium text-foreground opacity-80">
                "{transcript}"
              </div>
            )}
            
            {aiResponse && (
              <div className="text-2xl font-bold text-primary leading-tight">
                {aiResponse}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
