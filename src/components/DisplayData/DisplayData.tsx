import { Cell, Checkbox, Section } from '@telegram-apps/telegram-ui';
import type { FC, ReactNode } from 'react';

import { RGB } from '@/components/RGB/RGB';
import { Link } from '@/components/Link/Link';
import { bem } from '@/css/bem';

import './DisplayData.css';

const [, e] = bem('display-data');

export type DisplayDataRow = { title: string } & (
  | { type: 'link'; value?: string }
  | { value: ReactNode }
);

export interface DisplayDataProps {
  header?: ReactNode;
  footer?: ReactNode;
  rows: DisplayDataRow[];
}

export const DisplayData: FC<DisplayDataProps> = ({ header, rows }) => (
  <Section header={header}>
    {rows.map((item, idx) => {
      let valueNode: ReactNode;

      if (item.value === undefined) {
        valueNode = <i>empty</i>;
      } else {
        if ('type' in item) {
          valueNode = <Link href={item.value}>Open</Link>;
        } else if (typeof item.value === 'string') {
          // Assuming RGB is no longer tied to Telegram SDK's isRGB check
          // You might need to adjust this logic based on how RGB is now determined
          valueNode = <RGB color={item.value} />;
        } else if (typeof item.value === 'boolean') {
          valueNode = <Checkbox checked={item.value} disabled />;
        } else {
          valueNode = item.value;
        }
      }

      return (
        <Cell
          className={e('line')}
          subhead={item.title}
          readOnly
          multiline={true}
          key={idx}
        >
          <span className={e('line-value')}>{valueNode}</span>
        </Cell>
      );
    })}
  </Section>
);
