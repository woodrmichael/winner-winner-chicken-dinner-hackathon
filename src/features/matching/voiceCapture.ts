export type VoiceCaptureOptions = {
  value: string;
  update: (text: string) => void;
  setListening: (active: boolean) => void;
  setFeedback: (message: string) => void;
};

export type VoicePhase = 'connecting' | 'recording' | 'finishing';
export type NativeVoice = { phase?: VoicePhase; toggle: () => void };
