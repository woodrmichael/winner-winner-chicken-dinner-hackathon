import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { neighborhoods } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, wrap } from '../../ui/kit';

export default function Offer() {
  const router = useRouter();
  const { group: requestedGroup } = useLocalSearchParams<{ group?: string }>();
  const { state, run } = useDemo();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const group = neighborhoods.find((name) => name === requestedGroup);
  const back = () =>
    router.replace(requestedGroup ? { pathname: '/', params: { view: 'groups' } } : '/');
  if (requestedGroup && (!group || !state.community.groups.includes(group))) {
    return (
      <Page title="Post to a group">
        <Card>
          <Copy>Join a neighborhood group before posting to it.</Copy>
          <Btn label="View my groups" onPress={back} />
        </Card>
      </Page>
    );
  }
  return (
    <Page title={group ? `Post to ${group}` : 'Post an offer'}>
      <Card>
        <Copy>
          {group
            ? `Your post will appear in ${group}’s group feed.`
            : 'Everyone on the community board can see this offer.'}
        </Copy>
        <Field label={group ? 'Post title' : 'Offer title'} value={title} change={setTitle} />
        <Field label="Description" value={body} change={setBody} multiline />
        <View style={wrap}>
          <Btn
            label={group ? 'Publish post' : 'Publish offer'}
            disabled={!title.trim() || !body.trim()}
            onPress={async () => {
              await run({ type: 'post', id: newId(), title, body, at: now(), group });
              back();
            }}
          />
          <Btn label="Cancel" secondary onPress={back} />
        </View>
      </Card>
    </Page>
  );
}
