import { ChevronLeft } from 'lucide-react-native';
import { Btn } from './kit';

export function BackButton({ label = 'Back', onPress }: { label?: string; onPress: () => void }) {
  return <Btn label={label} icon={ChevronLeft} iconOnly quiet onPress={onPress} />;
}
