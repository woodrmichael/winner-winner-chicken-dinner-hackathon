import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { neighborhoods } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, wrap } from '../../ui/kit';
import { BackButton } from '../../ui/BackButton';

export default function Offer() {
  const router = useRouter();
  const { group: requestedGroup } = useLocalSearchParams<{ group?: string }>();
  const { state, run, shared } = useDemo();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const group = neighborhoods.find((name) => name === requestedGroup);
  const back = () =>
    router.replace(requestedGroup ? { pathname: '/', params: { view: 'groups' } } : '/');
  const backButton = <BackButton label="Back to Community" onPress={() => router.canGoBack() ? router.back() : back()} />;
  if (shared.data?.account.kind !== 'resident') {
    return <Page title="Post an offer" back={backButton}><Card>
      <Copy>Open a resident profile to publish an offer.</Copy>
      <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />
    </Card></Page>;
  }
  if (requestedGroup && (!group || !state.community.groups.includes(group))) {
    return (
      <Page title="Post to a group" back={backButton}>
        <Card>
          <Copy>Join a neighborhood group before posting to it.</Copy>
          <Btn label="View my groups" onPress={back} />
        </Card>
      </Page>
    );
  }
  return (
    <Page title={group ? `Post to ${group}` : 'Post an offer'} back={backButton}>
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
