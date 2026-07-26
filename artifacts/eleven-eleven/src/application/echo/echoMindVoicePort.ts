import type {
  EchoMindLocale,
  EchoMindVoiceEnvelope,
} from './echoMindExperience';

export interface EchoMindVoicePort {
  canListen: boolean;
  canSpeak: boolean;
  listen: (
    locale: EchoMindLocale,
    onInterim: (text: string) => void,
  ) => Promise<string>;
  speak: (
    text: string,
    voice: EchoMindVoiceEnvelope,
  ) => Promise<void>;
  stop: () => void;
}
