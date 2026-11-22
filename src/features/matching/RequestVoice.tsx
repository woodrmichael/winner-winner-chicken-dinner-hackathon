import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Mic, Square } from 'lucide-react-native';
import { AccessibilityInfo, Animated, Platform, View } from 'react-native';
import { Btn, Copy, color, row, wrap } from '../../ui/kit';
import { useNativeVoice } from './useNativeVoice';

type SpeechSession = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechConstructor = new () => SpeechSession;

function speechRecognition() {
  if (Platform.OS !== 'web') return undefined;
  const browser = globalThis as typeof globalThis & {
    SpeechRecognition?: SpeechConstructor;
    webkitSpeechRecognition?: SpeechConstructor;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function RequestVoice({
  children,
  value,
  update,
  listening,
  setListening,
}: PropsWithChildren<{
  value: string;
  update: (text: string) => void;
  listening: boolean;
  setListening: (listening: boolean) => void;
}>) {
  const [feedback, setFeedback] = useState('');
  const [pulse] = useState(() => new Animated.Value(1));
  const session = useRef<SpeechSession | null>(null);
  const Recognition = speechRecognition();
  const native = useNativeVoice({ value, update, setListening, setFeedback });
  const status = native?.phase === 'connecting' ? 'Connecting…'
    : native?.phase === 'finishing' ? 'Finishing transcript…'
    : 'Listening...';

  useEffect(() => () => {
    const recognition = session.current;
    if (!recognition) return;
    recognition.onresult = recognition.onend = recognition.onerror = null;
    recognition.abort();
    setListening(false);
  }, [setListening]);

  useEffect(() => {
    if (!listening) return;
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || !active) return;
      const useNativeDriver = Platform.OS !== 'web';
      animation = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 620, useNativeDriver }),
        Animated.timing(pulse, { toValue: 1, duration: 620, useNativeDriver }),
      ]));
      animation.start();
    }).catch(() => {});
    return () => {
      active = false;
      animation?.stop();
      pulse.setValue(1);
    };
  }, [listening, pulse]);

  function toggle() {
    if (native) {
      native.toggle();
      return;
    }
    if (!Recognition) {
      setFeedback(Platform.OS === 'web'
        ? 'Live transcription is unavailable in this browser.'
        : 'Live transcription is unavailable in Expo Go.');
      return;
    }
    if (session.current) {
      session.current.stop();
      return;
    }
    const recognition = new Recognition();
    const existing = value.trimEnd();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = ({ results }) => {
      const transcript = Array.from(results, (result) => result[0]?.transcript.trim()).filter(Boolean).join(' ');
      update([existing, transcript].filter(Boolean).join(' '));
    };
    recognition.onerror = ({ error }) => {
      setFeedback(error === 'not-allowed'
        ? 'Allow microphone access in your browser to speak your request.'
        : 'Speech could not be transcribed. Try again or type your request.');
    };
    recognition.onend = () => {
      session.current = null;
      setListening(false);
    };
    try {
      session.current = recognition;
      recognition.start();
      setFeedback('');
      setListening(true);
    } catch {
      session.current = null;
      setFeedback('The microphone could not start. You can still type your request.');
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={row}>
        <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
        <Btn label={listening ? 'Stop listening' : 'Speak your request'}
          icon={listening ? Square : Mic} iconOnly secondary disabled={native?.phase === 'finishing'} onPress={toggle} />
      </View>
      {listening && <View accessibilityLiveRegion="polite" style={wrap}>
        <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.pine, opacity: pulse }} />
        <Copy kind="small" tint={color.pine}>{status}</Copy>
      </View>}
      {!listening && !!feedback && <View accessibilityLiveRegion="polite">
        <Copy kind="small" tint={color.muted}>{feedback}</Copy>
      </View>}
    </View>
  );
}
