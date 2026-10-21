import { IonIcon, IonSkeletonText } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import type { DocumentSummary } from '../../domain/documents';
import { formatDate } from '../../lib/format';
import { pages, useAppRouter } from '../../pages';
import { useIntlLocale } from '../../state/locale';
import { StatusPill } from '../history/StatusPill';
import './documents.css';

interface DocumentHeaderCardProps {
  document: DocumentSummary | undefined;
  /** Makes the status pill open the status page */
  linkStatus?: boolean;
}

export const DocumentHeaderCard: React.FC<DocumentHeaderCardProps> = ({ document, linkStatus = true }) => {
  const locale = useIntlLocale();
  const router = useAppRouter();

  if (!document) {
    return (
      <section className="doc-section doc-header" aria-hidden="true">
        <IonSkeletonText animated style={{ width: '40%', height: 18 }} />
        <IonSkeletonText animated style={{ width: '20%' }} />
        <IonSkeletonText animated style={{ width: '30%' }} />
      </section>
    );
  }

  return (
    <section className="doc-section doc-header">
      <div>
        <button
          type="button"
          className="doc-link"
          onPointerDown={() => void pages.client.preload()}
          onClick={() => router.push(`/clients/${document.client.id}`)}
        >
          {document.client.name}
        </button>
        <div className="doc-muted"># {document.number}</div>
        <div className="doc-muted doc-inline">
          <IonIcon icon={timeOutline} aria-hidden="true" />
          {formatDate(document.issuedAt, locale)}
        </div>
      </div>
      <StatusPill
        document={document}
        onPointerDown={linkStatus ? () => void pages.status.preload() : undefined}
        onClick={linkStatus ? () => router.push(`/documents/${document.id}/status`) : undefined}
      />
    </section>
  );
};
