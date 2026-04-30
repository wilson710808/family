'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message: string;
};

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceInput({ onResult, disabled = false, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // 检测浏览器是否支持语音识别
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'zh-TW'; // 优先使用繁体中文

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('麥克風權限被拒絕，請允許使用麥克風');
      } else if (event.error === 'no-speech') {
        setError('沒有檢測到語音，請再試一次');
      } else if (event.error === 'network') {
        setError('網絡錯誤，請檢查網絡連接');
      } else {
        setError('語音識別發生錯誤');
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  const toggleListening = () => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        // 如果已经在运行，先停止再开始
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      }
    }
  };

  // 不支持语音识别时返回null
  if (isLoading) {
    return (
      <button
        type="button"
        className={`p-3 text-gray-400 cursor-not-allowed ${className}`}
        disabled
        title="載入中..."
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </button>
    );
  }

  if (!isSupported) {
    return null; // 不显示按钮
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          p-3 rounded-full transition-colors
          ${isListening 
            ? 'text-red-500 bg-red-50 hover:bg-red-100 animate-pulse' 
            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        title={isListening ? '停止錄音' : '語音輸入'}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>
      
      {/* 错误提示 */}
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg whitespace-nowrap z-50">
          {error}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500"></div>
        </div>
      )}
    </div>
  );
}
