import { useState } from 'react';
import { View } from 'react-native';
import { impact } from '../../domain/model';
import { program } from '../../domain/seed';
import { useDemo } from '../../state/Demo';
import { Segments } from '../../ui/Segments';
import { Card, Columns, Copy, Page, ProgressBar, color, row } from '../../ui/kit';

export default function Impact() {
  const { state } = useDemo();
  const data = impact(state);
  const [by, setBy] = useState<'Service' | 'Provider'>('Service');
  const counts = by === 'Service' ? data.byCategory : data.byProvider;
  const money = (value: number) => '$' + value.toLocaleString('en-US');
  return (
    <Page title="Community impact">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[
          ['Requests received', data.received],
          ['Open referrals', data.open],
          ['Services delivered', data.delivered],
        ].map(([label, value]) => (
          <Card
            key={label}
            style={{
              flexGrow: 1,
              flexBasis: 135,
              backgroundColor: label === 'Services delivered' ? color.pale : color.paper,
            }}
          >
            <Copy kind="title" style={{ fontSize: 40, lineHeight: 46 }}>
              {value}
            </Copy>
            <Copy kind="strong">{label}</Copy>
          </Card>
        ))}
      </View>
      <Columns
        main={
          <Card>
            <Copy kind="title">Assistance delivered</Copy>
            <Segments
              options={['Service', 'Provider'] as const}
              value={by}
              onChange={setBy}
              label={(item) => 'By ' + item.toLowerCase()}
            />
            {counts.map((item) => (
              <View key={item.name} style={{ gap: 5 }}>
                <View style={[row, { justifyContent: 'space-between' }]}>
                  <Copy>{item.name}</Copy>
                  <Copy kind="strong">{item.count}</Copy>
                </View>
                <ProgressBar value={item.count} total={data.delivered} />
              </View>
            ))}
          </Card>
        }
        side={
          <Card>
            <Copy kind="label" tint={color.pine}>
              SPONSORED PROGRAM
            </Copy>
            <Copy kind="title">{program.name}</Copy>
            <Copy>Supported by {program.sponsor}.</Copy>
            <Copy kind="strong">{money(program.received)} received</Copy>
            <Copy kind="small">
              of {money(program.goal)} goal · {money(program.pledged)} pledged separately
            </Copy>
            <ProgressBar value={program.received} total={program.goal} />
            <Copy kind="strong">
              {data.programDeliveries} program{' '}
              {data.programDeliveries === 1 ? 'delivery' : 'deliveries'}
            </Copy>
          </Card>
        }
      />
    </Page>
  );
}
