import { AvailState } from '@/lib/availability';
import { API_DAYS_OF_WEEK } from './types';

interface AvailMiniProps {
  avail: AvailState;
  periods: number[];
  days?: readonly string[];
  onColor?: string;
  offColor?: string;
}

/** Read-only availability heat-map (4×4 dot grid). Shared by the entity list rows. */
export function AvailMini({
  avail,
  periods,
  days = API_DAYS_OF_WEEK,
  onColor = '#10B981',
  offColor = '#E2E8F0',
}: AvailMiniProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {days.map((d) => (
        <div key={d} style={{ display: 'flex', gap: 1 }}>
          {periods.map((p) => (
            <div
              key={p}
              style={{
                width: 4,
                height: 4,
                borderRadius: 1,
                background: avail[d]?.[p] ? onColor : offColor,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default AvailMini;
