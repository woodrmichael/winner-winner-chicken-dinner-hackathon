
import { useState } from 'react';
import { View } from 'react-native';
import { deliveredServices, impact } from '../../domain/model';
import { program } from '../../domain/seed';
import { partnerName } from '../matching/directory';
import { useDemo } from '../../state/Demo';
import { Segments } from '../../ui/Segments';
import {
  Card,
  Columns,
  Copy,
  Page,
  ProgressBar,
  color,
  row,
} from '../../ui/kit';

export default function Impact() {
  const { state, shared } = useDemo();
  const data = shared.data?.reporting.impact ?? impact(state);

  const [by, setBy] = useState<'Service' | 'Provider'>('Service');

  const counts = by === 'Service'
    ? data.byCategory
    : data.byProvider;

  const money = (value: number) =>
    '$' + value.toLocaleString('en-US');

  // Find the provider responsible for delivering the program.
  const programProvider = partnerName(program.providerId);

  // Find actual deliveries associated with this program.
  const programServices = (shared.data?.reporting.programServices ?? deliveredServices(state)
    .filter((service) => service.programId === program.id)).slice()
    .sort(
      (a, b) =>
        new Date(b.deliveredAt).getTime() -
        new Date(a.deliveredAt).getTime()
    );

  return (
    <Page title="Community impact">
      {/* Overall impact statistics */}
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
              backgroundColor:
                label === 'Services delivered'
                  ? color.pale
                  : color.paper,
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
          <View style={{ gap: 12 }}>
            {/* Delivery attribution */}
            <Card>
              <Copy kind="title">Delivery attribution</Copy>

              <Copy kind="label" tint={color.pine}>
                SPONSORED PROGRAM
              </Copy>

              <Copy kind="title">{program.name}</Copy>

              <Copy>
                Delivered by {programProvider}
              </Copy>

              <Copy kind="small">
                Sponsored by {program.sponsor}
              </Copy>

              <View style={{ marginTop: 10 }}>
                <Copy kind="title">
                  {data.programDeliveries}
                </Copy>
                <Copy kind="strong">
                  Program deliveries
                </Copy>
              </View>

              <ProgressBar
                value={data.programDeliveries}
                total={Math.max(data.delivered, 1)}
              />
            </Card>

            {/* Service and provider breakdown */}
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
                  <View
                    style={[
                      row,
                      { justifyContent: 'space-between' },
                    ]}
                  >
                    <Copy>{item.name}</Copy>
                    <Copy kind="strong">{item.count}</Copy>
                  </View>

                  <ProgressBar
                    value={item.count}
                    total={Math.max(data.delivered, 1)}
                  />
                </View>
              ))}
            </Card>
          </View>
        }
        side={
          <View style={{ gap: 12 }}>
            {/* Program funding */}
            <Card>
              <Copy kind="label" tint={color.pine}>
                PROGRAM FUNDING
              </Copy>

              <Copy kind="title">{program.name}</Copy>

              <Copy>
                Supported by {program.sponsor}.
              </Copy>

              <Copy kind="strong">
                {money(program.received)} received
              </Copy>

              <Copy kind="small">
                of {money(program.goal)} goal ·{' '}
                {money(program.pledged)} pledged separately
              </Copy>

              <ProgressBar
                value={program.received}
                total={program.goal}
              />
            </Card>

            {/* Actual program delivery records */}
            <Card>
              <Copy kind="title">
                Program delivery records
              </Copy>

              <Copy kind="small">
                Services recorded under {program.name}.
              </Copy>

              {programServices.length === 0 ? (
                <Copy kind="small">
                  No program deliveries recorded yet.
                </Copy>
              ) : (
                programServices.map((service, index) => (
                  <View
                    key={`${service.deliveredAt}:${service.category}:${index}`}
                    style={{ gap: 4, marginTop: 10 }}
                  >
                    <Copy kind="strong">
                      {service.category}
                    </Copy>

                    <Copy kind="small">
                      Delivered by {partnerName(service.providerId)}
                    </Copy>

                    <Copy kind="small">
                      {new Date(
                        service.deliveredAt
                      ).toLocaleDateString()}
                    </Copy>
                  </View>
                ))
              )}
            </Card>
          </View>
        }
      />
    </Page>
  );
}
