import { Copy, color } from '../../ui/kit';

const postedAt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

export function PostTimestamp({ date }: { date: string }) {
  return (
    <Copy kind="small" tint={color.muted}>
      Posted {postedAt.format(new Date(date))}
    </Copy>
  );
}
