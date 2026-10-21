import { useTranslation } from 'react-i18next';
import type { DocumentSummary } from '../../domain/documents';
import './StatusPill.css';

interface StatusPillProps {
  document: DocumentSummary;
  /** Without a handler the pill is a plain label */
  onClick?: () => void;
  onPointerDown?: () => void;
}

export const StatusPill: React.FC<StatusPillProps> = ({ document, onClick, onPointerDown }) => {
  const { t } = useTranslation();
  const status = document.isCancelled ? 'cancelled' : document.status;
  const className = `status-pill status-pill--${status}`;

  if (!onClick) return <span className={`${className} status-pill--static`}>{t(`status.${status}`)}</span>;

  return (
    <button type="button" className={className} onPointerDown={onPointerDown} onClick={onClick}>
      {t(`status.${status}`)}
    </button>
  );
};
