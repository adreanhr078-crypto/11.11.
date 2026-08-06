import type {
  EchoMindVoicePort,
} from '../../application/echo/echoMindVoicePort';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: {
    transcript: string;
  };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

type VoiceWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const voiceWindow = window as VoiceWindow;
  return voiceWindow.SpeechRecognition
    ?? voiceWindow.webkitSpeechRecognition
    ?? null;
}

export function createBrowserEchoMindVoice(): EchoMindVoicePort {
  let activeRecognition: SpeechRecognitionLike | null = null;

  return {
    get canListen() {
      return recognitionConstructor() !== null;
    },
    get canSpeak() {
      return (
        typeof window !== 'undefined'
        && 'speechSynthesis' in window
        && typeof SpeechSynthesisUtterance !== 'undefined'
      );
    },
    listen(locale, onInterim) {
      const Recognition = recognitionConstructor();
      if (!Recognition) {
        return Promise.reject(new Error('VOICE_INPUT_UNAVAILABLE'));
      }

      window.speechSynthesis?.cancel();
      activeRecognition?.abort();

      return new Promise<string>((resolve, reject) => {
        const recognition = new Recognition();
        activeRecognition = recognition;
        recognition.lang = locale === 'en' ? 'en-US' : 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        let finalTranscript = '';

        recognition.onresult = (event) => {
          let interimTranscript = '';
          for (
            let index = event.resultIndex;
            index < event.results.length;
            index += 1
          ) {
            const result = event.results[index];
            if (!result?.[0]) continue;
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
          onInterim((finalTranscript || interimTranscript).trim());
        };
        recognition.onerror = (event) => {
          activeRecognition = null;
          reject(new Error(event.error || 'VOICE_INPUT_FAILED'));
        };
        recognition.onend = () => {
          activeRecognition = null;
          const transcript = finalTranscript.trim();
          if (transcript) {
            resolve(transcript);
          } else {
            reject(new Error('VOICE_INPUT_EMPTY'));
          }
        };
        recognition.start();
      });
    },
    speak(text, voice, volume = 1) {
      if (
        typeof window === 'undefined'
        || !('speechSynthesis' in window)
        || typeof SpeechSynthesisUtterance === 'undefined'
      ) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice.locale;
        utterance.rate = voice.mood === 'distorted'
          ? 0.82
          : voice.mood === 'tense'
            ? 0.94
            : 0.9;
        utterance.pitch = voice.mood === 'distorted'
          ? 0.72
          : voice.mood === 'fragile'
            ? 0.9
            : 0.82;
        utterance.volume = Math.min(1, Math.max(0, volume));

        const languagePrefix = voice.locale.slice(0, 2).toLowerCase();
        utterance.voice = window.speechSynthesis
          .getVoices()
          .find((candidate) => (
            candidate.lang.toLowerCase().startsWith(languagePrefix)
          )) ?? null;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    },
    stop() {
      activeRecognition?.abort();
      activeRecognition = null;
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    },
  };
}
