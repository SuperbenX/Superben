
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

const LiveGuide: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [transcription, setTranscription] = useState('');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
  }, []);

  const startSession = async () => {
    setStatus('connecting');
    // Create new instance right before use as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputAudioContext;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('active');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Use sessionPromise to prevent race conditions as per guidelines
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioStr = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioStr) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(decode(audioStr), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + message.serverContent?.outputTranscription?.text);
            }
            if (message.serverContent?.turnComplete) {
              setTranscription('');
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try {
                  s.stop();
                } catch(err) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are Luna, a gentle sleep guide. Your voice is calm, slow, and soothing. Guide the user through a body scan meditation or simple breathing exercises. Keep responses brief and prioritize silence and long pauses to help them drift off.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-700">
      <div className="relative">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 border-2 ${
          isActive ? 'border-indigo-500 scale-110 shadow-[0_0_60px_rgba(79,70,229,0.3)]' : 'border-slate-800 scale-100'
        }`}>
          <div className={`absolute inset-0 rounded-full border border-indigo-500/20 ${isActive ? 'animate-ping' : ''}`}></div>
          <span className="text-6xl">{isActive ? '🌙' : '✨'}</span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-serif text-indigo-200">
          {status === 'idle' && 'Quiet Meditation'}
          {status === 'connecting' && 'Connecting to Luna...'}
          {status === 'active' && 'Breathing with Luna'}
        </h2>
        <p className="text-slate-500 text-sm mt-2 px-8">
          {isActive 
            ? "Speak softly if you wish, or just listen to Luna's guidance." 
            : "Requires microphone access for a real-time voice experience."}
        </p>
      </div>

      {transcription && (
        <div className="glass-panel px-6 py-4 rounded-2xl max-w-sm text-center text-indigo-300 italic text-sm">
          "{transcription}"
        </div>
      )}

      <button
        onClick={isActive ? stopSession : startSession}
        className={`px-12 py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-xl ${
          isActive 
            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
            : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105'
        }`}
      >
        {status === 'connecting' ? 'Please wait...' : isActive ? 'End Session' : 'Begin Journey'}
      </button>
    </div>
  );
};

export default LiveGuide;
