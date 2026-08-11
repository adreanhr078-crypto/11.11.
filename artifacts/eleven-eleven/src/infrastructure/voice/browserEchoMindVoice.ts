import type {
  EchoMindVoicePort,
} from '../../application/echo/echoMindVoicePort';
import {
  getCurrentAuthToken,
} from '../../features/auth/authService';

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
  webkitAudioContext?: typeof AudioContext;
};

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const voiceWindow = window as VoiceWindow;
  return voiceWindow.SpeechRecognition
    ?? voiceWindow.webkitSpeechRecognition
    ?? null;
}

function recorderMimeType(): string | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }

  const candidates = [
    'audio/ogg;codecs=opus',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
  ];
  return candidates.find((candidate) => (
    typeof MediaRecorder.isTypeSupported !== 'function'
      || MediaRecorder.isTypeSupported(candidate)
  )) ?? null;
}

function canRecordAudio(): boolean {
  return (
    typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && recorderMimeType() !== null
  );
}

function audioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const voiceWindow = window as VoiceWindow;
  return window.AudioContext ?? voiceWindow.webkitAudioContext ?? null;
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWav(audioBuffer: AudioBuffer): Blob {
  const channels = Math.min(2, Math.max(1, audioBuffer.numberOfChannels));
  const bytesPerSample = 2;
  const dataLength = audioBuffer.length * channels * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(wavBuffer);
  const channelData = Array.from({ length: channels }, (_, channel) => (
    audioBuffer.getChannelData(channel)
  ));

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let frame = 0; frame < audioBuffer.length; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = channelData[channel]?.[frame] ?? 0;
      const normalized = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        offset,
        normalized < 0 ? normalized * 0x8000 : normalized * 0x7FFF,
        true,
      );
      offset += bytesPerSample;
    }
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

async function normalizeRecording(blob: Blob): Promise<Blob> {
  if (blob.type.toLowerCase().startsWith('audio/wav')) return blob;
  const AudioContextConstructor = audioContextConstructor();
  if (!AudioContextConstructor) return blob;

  const context = new AudioContextConstructor();
  try {
    const audioBuffer = await context.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(audioBuffer);
  } catch {
    return blob;
  } finally {
    await context.close().catch(() => undefined);
  }
}

function getTranscriptionEndpoint(): string {
  const explicitEndpoint = import.meta.env.VITE_ECHO_TRANSCRIBE_ENDPOINT?.trim();
  if (explicitEndpoint) return explicitEndpoint;

  const chatEndpoint = import.meta.env.VITE_ECHO_AI_ENDPOINT?.trim();
  if (chatEndpoint) {
    try {
      const endpoint = new URL(
        chatEndpoint,
        typeof window === 'undefined' ? undefined : window.location.origin,
      );
      if (/\/chat\/?$/i.test(endpoint.pathname)) {
        endpoint.pathname = endpoint.pathname.replace(/\/chat\/?$/i, '/transcribe');
        endpoint.search = '';
        endpoint.hash = '';
        return endpoint.toString();
      }
    } catch {
      // Use the same-origin route when a custom endpoint is malformed.
    }
  }
  return '/api/echo/transcribe';
}

async function requestAiTranscript(blob: Blob, locale: 'ar' | 'en'): Promise<string> {
  const token = await getCurrentAuthToken();
  if (!token) throw new Error('VOICE_TRANSCRIPTION_UNAVAILABLE');
  const response = await fetch(
    `${getTranscriptionEndpoint()}?locale=${encodeURIComponent(locale)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': blob.type || 'audio/wav',
      },
      body: blob,
    },
  );
  let payload: unknown = null;
  try {
    payload = await response.json() as unknown;
  } catch {
    // The generic error below keeps provider details out of the UI.
  }
  if (!response.ok) throw new Error('VOICE_TRANSCRIPTION_FAILED');
  if (
    typeof payload === 'object'
    && payload !== null
    && 'transcript' in payload
    && typeof payload.transcript === 'string'
    && payload.transcript.trim()
  ) {
    return payload.transcript.trim();
  }
  throw new Error('VOICE_INPUT_EMPTY');
}

export function createBrowserEchoMindVoice(): EchoMindVoicePort {
  let activeRecognition: SpeechRecognitionLike | null = null;
  let activeRecorder: MediaRecorder | null = null;
  let activeStream: MediaStream | null = null;

  const listenWithBrowserRecognition = (
    locale: 'ar' | 'en',
    onInterim: (text: string) => void,
  ): Promise<string> => {
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
  };

  const listenWithAiTranscription = async (
    locale: 'ar' | 'en',
  ): Promise<string> => {
    const mimeType = recorderMimeType();
    if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('VOICE_INPUT_UNAVAILABLE');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType });
    activeRecorder = recorder;
    activeStream = stream;

    return new Promise<string>((resolve, reject) => {
      const chunks: Blob[] = [];
      let settled = false;
      const cleanup = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (activeRecorder === recorder) activeRecorder = null;
        if (activeStream === stream) activeStream = null;
      };
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => fail(new Error('VOICE_INPUT_FAILED'));
      recorder.onstop = () => {
        cleanup();
        void (async () => {
          try {
            const recording = new Blob(chunks, {
              type: recorder.mimeType || mimeType,
            });
            if (recording.size === 0) throw new Error('VOICE_INPUT_EMPTY');
            const normalizedRecording = await normalizeRecording(recording);
            const transcript = await requestAiTranscript(normalizedRecording, locale);
            if (settled) return;
            settled = true;
            resolve(transcript);
          } catch (error) {
            fail(error instanceof Error ? error : new Error('VOICE_INPUT_FAILED'));
          }
        })();
      };

      try {
        recorder.start();
      } catch (error) {
        fail(error instanceof Error ? error : new Error('VOICE_INPUT_FAILED'));
      }
    });
  };

  return {
    get canListen() {
      return canRecordAudio() || recognitionConstructor() !== null;
    },
    get canSpeak() {
      return (
        typeof window !== 'undefined'
        && 'speechSynthesis' in window
        && typeof SpeechSynthesisUtterance !== 'undefined'
      );
    },
    async listen(locale, onInterim) {
      if (canRecordAudio()) {
        try {
          return await listenWithAiTranscription(locale);
        } catch (error) {
          if (recognitionConstructor() === null) throw error;
        }
      }
      return listenWithBrowserRecognition(locale, onInterim);
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
      if (activeRecorder && activeRecorder.state !== 'inactive') {
        activeRecorder.stop();
      }
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    },
  };
}
