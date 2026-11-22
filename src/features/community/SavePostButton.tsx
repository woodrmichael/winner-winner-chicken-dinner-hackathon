import { Bookmark } from 'lucide-react-native';
import { useDemo } from '../../state/Demo';
import { Btn } from '../../ui/kit';

export function SavePostButton({ postId }: { postId: string }) {
  const { state, run, shared } = useDemo();
  if (shared.data?.account.kind !== 'resident') return null;
  const saved = state.community.savedPostIds.includes(postId);
  return (
    <Btn
      label={saved ? 'Remove from saved' : 'Save post'}
      icon={Bookmark}
      iconOnly
      fillIcon={saved}
      secondary
      onPress={() => run({ type: 'save-post', postId, saved: !saved })}
    />
  );
}
