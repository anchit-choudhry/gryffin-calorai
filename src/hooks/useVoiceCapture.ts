import { useEffect, useRef, useState } from "react";
import { sanitizeVoiceTranscript } from "../types";

interface VoiceSpeechEvent extends Event {
  readonly results: {
    readonly length: number;
    [index: number]: {
      readonly length: number;
      [index: number]: { readonly transcript: string };
    };
  };
}

interface VoiceErrorEvent extends Event {
  readonly error: string;
}

interface VoiceRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: VoiceSpeechEvent) => void) | null;
  onerror: ((event: VoiceErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type VoiceRecognitionCtor = new () => VoiceRecognitionInstance;

const getRecognitionCtor = (): VoiceRecognitionCtor | null =>
  (
    window as {
      SpeechRecognition?: VoiceRecognitionCtor;
      webkitSpeechRecognition?: VoiceRecognitionCtor;
    }
  ).SpeechRecognition ??
  (window as { webkitSpeechRecognition?: VoiceRecognitionCtor }).webkitSpeechRecognition ??
  null;

export const useVoiceCapture = () => {
  const recognitionRef = useRef<VoiceRecognitionInstance | null>(null);
  const listeningRef = useRef<boolean>(false);
  const [isSupported] = useState<boolean>(() => getRecognitionCtor() !== null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopListening = () => {
    listeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const startListening = () => {
    setError(null);
    setTranscript(null);

    recognitionRef.current?.abort();
    listeningRef.current = false;

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new Ctor();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: VoiceSpeechEvent) => {
      if (!listeningRef.current) return;
      const raw = event.results[0]?.[0]?.transcript ?? "";
      const sanitized = sanitizeVoiceTranscript(raw);
      if (sanitized) {
        setTranscript(sanitized);
        stopListening();
      }
    };

    recognition.onerror = (event: VoiceErrorEvent) => {
      if (!listeningRef.current) return;
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          setError("Microphone access denied. Please allow microphone permissions.");
          break;
        case "no-speech":
          setError("No speech detected. Try again.");
          break;
        case "audio-capture":
          setError("No microphone found.");
          break;
        default:
          setError("Voice recognition encountered an error. Please try again.");
      }
      listeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        listeningRef.current = false;
        setIsListening(false);
      }
    };

    setIsListening(true);
    listeningRef.current = true;

    try {
      recognition.start();
    } catch {
      setError("Voice recognition encountered an error. Please try again.");
      listeningRef.current = false;
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
};
