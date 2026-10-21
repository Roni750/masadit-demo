import { IonButton, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { DocumentFilter, DocumentType } from '../../domain/documents';
import { DocumentCard } from './DocumentCard';
import { DocumentCardSkeleton } from './DocumentCardSkeleton';
import { prefetchDocuments, useDocuments, useTypeTotals } from './queries';
import { TypeTotalsPanel } from './TypeTotalsPanel';
import './HistoryPage.css';

const SKELETON_COUNT = 4;

interface DocumentFeedProps {
  /** Filters set by the screen (search, client, status); the feed adds the document type */
  filter: Omit<DocumentFilter, 'type'>;
  /** The type picked in the totals panel; owned by the screen so it can use it too (e.g. for exports) */
  selectedType: DocumentType | undefined;
  onSelectedTypeChange: (type: DocumentType | undefined) => void;
  showTotals?: boolean;
}

// The per-type totals panel plus the paginated document cards. Used by History and by a client's documents tab.
export const DocumentFeed: React.FC<DocumentFeedProps> = ({
  filter,
  selectedType,
  onSelectedTypeChange,
  showTotals = true,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const documents = useDocuments({ ...filter, type: selectedType });
  // Totals ignore the type filter: they're the same whichever type is selected
  const totals = useTypeTotals(filter);
  const items = documents.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      {showTotals && (
        <TypeTotalsPanel
          totals={totals.data}
          selectedType={selectedType}
          onSelect={onSelectedTypeChange}
          onIntent={(type) => void prefetchDocuments(queryClient, { ...filter, type })}
        />
      )}

      {documents.isPending &&
        Array.from({ length: SKELETON_COUNT }, (_, index) => <DocumentCardSkeleton key={index} />)}

      {documents.isError && (
        <div className="history-message">
          <p>{t('history.loadError')}</p>
          <IonButton fill="outline" onClick={() => void documents.refetch()}>
            {t('common.retry')}
          </IonButton>
        </div>
      )}

      {documents.isSuccess && items.length === 0 && <p className="history-message">{t('history.empty')}</p>}

      {items.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}

      <IonInfiniteScroll
        disabled={!documents.hasNextPage}
        onIonInfinite={async (event) => {
          await documents.fetchNextPage();
          await event.target.complete();
        }}
      >
        <IonInfiniteScrollContent />
      </IonInfiniteScroll>
    </>
  );
};
