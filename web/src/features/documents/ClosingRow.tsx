import { IonIcon, IonSpinner } from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import './documents.css';

interface ClosingRowProps {
  label: string;
  detail?: string;
  amount: string;
  checked: boolean;
  disabled: boolean;
  /** This row's own change is in flight */
  pending?: boolean;
  onToggle: () => void;
}

// One row in a closing list: checked rows are existing allocations, unchecked ones are candidates.
// The checkbox only mirrors server data; it changes after the write succeeds and the data refreshes,
// so a failed write can never leave it showing a state the server doesn't have.
export const ClosingRow: React.FC<ClosingRowProps> = ({
  label,
  detail,
  amount,
  checked,
  disabled,
  pending = false,
  onToggle,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    className="closing-row"
    disabled={disabled}
    onClick={onToggle}
  >
    <span className={`closing-row__box ${checked ? 'closing-row__box--checked' : ''}`} aria-hidden="true">
      {pending ? <IonSpinner name="crescent" /> : checked && <IonIcon icon={checkmark} />}
    </span>
    <span className="closing-row__text">
      <span className="closing-row__label">{label}</span>
      {detail && <span className="doc-muted">{detail}</span>}
    </span>
    <span className="closing-row__amount">{amount}</span>
  </button>
);
