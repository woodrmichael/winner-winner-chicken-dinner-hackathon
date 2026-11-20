import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { newId, now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, wrap } from '../../ui/kit';

export default function Offer() {
  const router = useRouter();
  const { run } = useDemo();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return (
    <Page title="Post an offer">
      <Card>
        <Copy>Everyone on the community board can see this offer.</Copy>
        <Field label="Offer title" value={title} change={setTitle} />
        <Field label="Description" value={body} change={setBody} multiline />
        <View style={wrap}>
          <Btn
            label="Publish offer"
            disabled={!title.trim() || !body.trim()}
            onPress={async () => {
              await run({ type: 'post', id: newId(), title, body, at: now() });
              router.replace('/');
            }}
          />
          <Btn label="Cancel" secondary onPress={() => router.replace('/')} />
        </View>
      </Card>
    </Page>
  );
}
