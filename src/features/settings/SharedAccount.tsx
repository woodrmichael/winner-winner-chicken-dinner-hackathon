import { useState } from 'react';
import { View } from 'react-native';
import { useDemo } from '../../state/Demo';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field } from '../../ui/kit';
import { directory, partnerName } from '../matching/directory';

export function SharedAccount() {
  const { shared, run } = useDemo();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const data = shared.data;

  if (!data) {
    return (
      <Card>
        <Copy kind="title">Sign in to the shared workspace</Copy>
        {shared.connectionError ? <Copy>{shared.connectionError}</Copy> : null}
        <Field label="Username" value={username} change={setUsername} autoCapitalize="none" />
        <Field label="Password" value={password} change={setPassword} secure />
        <Btn label="Sign in" disabled={!username.trim() || !password} onPress={async () => {
          await shared.signIn(username, password);
          setPassword('');
          setOrganization('');
        }} />
      </Card>
    );
  }

  const { account, requests } = data;
  const membership = account.membership;
  return (
    <>
      <Card>
        <Copy kind="title">{account.name}</Copy>
        <Copy>{account.kind === 'resident' ? 'Resident account' : 'Worker account'}</Copy>
        {membership && (
          <Copy>{partnerName(membership.partnerId)} · {membership.status === 'pending'
            ? 'Approval pending' : membership.admin ? 'Organization administrator' : 'Approved worker'}</Copy>
        )}
        {shared.connectionError ? <Copy>{shared.connectionError}</Copy> : null}
        <Btn label="Sign out" secondary onPress={shared.signOut} />
      </Card>
      {account.kind === 'worker' && !membership && (
        <Card>
          <Copy kind="title">Request organization access</Copy>
          <View accessibilityRole="radiogroup" accessibilityLabel="Organization">
            {directory.map(({ id, name }) => (
              <SelectionRow key={id} label={name} selected={organization === id} onPress={() => setOrganization(id)} />
            ))}
          </View>
          <Btn label="Request membership" disabled={!organization}
            onPress={() => run({ type: 'request-membership', partnerId: organization })} />
        </Card>
      )}
      {membership?.status === 'approved' && membership.admin && (
        <Card>
          <Copy kind="title">Membership requests</Copy>
          {!requests.length && <Copy>No pending requests.</Copy>}
          {requests.map(({ id, name }) => (
            <View key={id} style={{ gap: 6 }}>
              <Copy>{name}</Copy>
              <Btn label={`Approve ${name}`} onPress={() => run({ type: 'approve-membership', accountId: id })} />
            </View>
          ))}
        </Card>
      )}
    </>
  );
}
