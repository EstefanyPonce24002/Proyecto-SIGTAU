import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Search } from "lucide-react";

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  style?: React.CSSProperties;
}

export function VoiceSearchInput({
  value,
  onChange,
  placeholder,
  className = "",
  style,
}: Props) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const SpeechRecognition =
    (window as SpeechWindow).SpeechRecognition ??
    (window as SpeechWindow).webkitSpeechRecognition;

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  const toggleListening = () => {
    setVoiceError(null);

    if (!SpeechRecognition) {
      setVoiceError(
        "La búsqueda por voz no está disponible en este navegador.",
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-SV";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        setListening(false);
        recognitionRef.current = null;
      }
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current === recognition) {
        setListening(false);
        recognitionRef.current = null;
      }
      setVoiceError(
        event.error === "not-allowed"
          ? "Permite el acceso al micrófono para buscar por voz."
          : "No se pudo reconocer la búsqueda. Inténtalo de nuevo.",
      );
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) onChange(transcript.trim());
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceError("No se pudo iniciar el micrófono. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="relative">
      <Search
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full rounded-xl border border-border bg-card text-foreground pl-10 pr-11 py-2.5 outline-none focus:ring-2 transition-all placeholder:text-muted-foreground ${className}`}
        style={
          {
            "--tw-ring-color": "var(--brand-teal)",
            ...style,
          } as React.CSSProperties
        }
      />
      <button
        type="button"
        onClick={toggleListening}
        aria-label={listening ? "Detener búsqueda por voz" : "Buscar por voz"}
        title={listening ? "Detener búsqueda por voz" : "Buscar por voz"}
        className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all ${listening ? "text-white bg-[var(--brand-teal)]" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
      >
        {listening ? <MicOff size={15} /> : <Mic size={15} />}
      </button>
      {voiceError && (
        <p
          className="absolute left-0 top-full mt-1 text-destructive"
          role="status"
          style={{ fontSize: "0.7rem" }}
        >
          {voiceError}
        </p>
      )}
    </div>
  );
}
