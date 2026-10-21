import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
  useIonToast,
} from '@ionic/react';
import { add, mailOutline, optionsOutline, printOutline, shareSocialOutline, trashOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import type { DocumentDetail } from '../../domain/documents';
import { useConfirm } from '../../hooks/useConfirm';
import { useErrorToast } from '../../hooks/useErrorToast';
import { useWipAlert } from '../../hooks/useWipAlert';
import { formatDate, formatMoney } from '../../lib/format';
import { pages, useAppRouter } from '../../pages';
import { useIntlLocale } from '../../state/locale';
import { canRemind, scheduleDueReminder } from './reminders';
import { useShareDocument } from './useShareDocument';
import { DocumentHeaderCard } from './DocumentHeaderCard';
import { useCancelDocument, useDeleteDocument, useDocument } from './queries';
import './documents.css';

const DocumentSections: React.FC<{ document: DocumentDetail }> = ({ document }) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const money = (value: Parameters<typeof formatMoney>[0]) => formatMoney(value, locale);

  return (
    <>
      <section className="doc-section">
        <h2 className="doc-section__title">{t('document.lines')}</h2>
        {document.lines.map((line) => (
          <div key={line.id} className="doc-row">
            <span>{line.description}</span>
            <span className="doc-row__end">
              <div>{money(line.total)}</div>
              <div className="doc-muted">{t('document.unitPrice', { price: money(line.unitPrice) })}</div>
              <div className="doc-muted">{t('document.quantity', { quantity: line.quantity })}</div>
            </span>
          </div>
        ))}
      </section>

      {document.payments.length > 0 && (
        <section className="doc-section">
          <h2 className="doc-section__title">{t('document.payments')}</h2>
          {document.payments.map((payment) => (
            <div key={payment.id} className="doc-row">
              <span>
                <div>{t(`paymentMethod.${payment.method}`)}</div>
                <div className="doc-muted">{formatDate(payment.paidAt, locale)}</div>
              </span>
              <span>{money(payment.amountIls)}</span>
            </div>
          ))}
        </section>
      )}

      <section className="doc-section">
        <h2 className="doc-section__title">{t('document.summary')}</h2>
        <div className="doc-row">
          <span className="doc-row__label">{t('document.exemptTotal')}</span>
          <span>{money(document.exemptSubtotal)}</span>
        </div>
        <div className="doc-row">
          <span className="doc-row__label">{t('document.taxableTotal')}</span>
          <span>{money(document.taxableSubtotal)}</span>
        </div>
        <div className="doc-row">
          <span className="doc-row__label">{t('document.vatRate', { rate: document.vatRate })}</span>
          <span>{money(document.vat)}</span>
        </div>
        <div className="doc-row doc-row--strong">
          <span className="doc-row__label">{t('document.totalToPay')}</span>
          <span>{money(document.total)}</span>
        </div>
      </section>
    </>
  );
};

const SectionsSkeleton: React.FC = () => (
  <section className="doc-section" aria-hidden="true">
    {[0, 1, 2, 3].map((key) => (
      <div key={key} className="doc-row">
        <IonSkeletonText animated style={{ width: '35%' }} />
        <IonSkeletonText animated style={{ width: '20%' }} />
      </div>
    ))}
  </section>
);

const DocumentPage: React.FC = () => {
  const id = Number(useParams().id);
  const { t } = useTranslation();
  const router = useAppRouter();
  const showWip = useWipAlert();
  const confirm = useConfirm();
  const showError = useErrorToast();
  const [presentActionSheet] = useIonActionSheet();
  const [presentToast] = useIonToast();
  const shareDocument = useShareDocument();
  const locale = useIntlLocale();

  const { data: document, summary, isError, refetch } = useDocument(id);
  const cancelDocument = useCancelDocument();
  const deleteDocument = useDeleteDocument();

  const describe = () => ({ type: summary ? t(`documentType.${summary.type}`) : '', number: summary?.number });

  const handleDelete = async () => {
    if (!(await confirm(t('document.deleteConfirm', describe())))) return;
    deleteDocument.mutate(id, {
      onSuccess: () => router.canGoBack() ? router.goBack() : router.push('/history', 'back', 'replace'),
      onError: showError,
    });
  };

  const handleCancel = async () => {
    if (!(await confirm(t('document.cancelConfirm', describe())))) return;
    cancelDocument.mutate(id, { onError: showError });
  };

  const wip = () => void showWip();
  const share = () => summary && void shareDocument(summary);

  const remind = async () => {
    if (!summary) return;
    const result = await scheduleDueReminder(summary, t).catch(() => null);
    if (!result) return showError(null);
    const message =
      result === 'denied'
        ? t('document.reminderDenied')
        : result.overdue
          ? t('document.reminderOverdue')
          : t('document.reminderSet', { date: formatDate(result.scheduledFor.toISOString().slice(0, 10), locale) });
    void presentToast({ message, duration: 3000, position: 'bottom' });
  };

  // The menu leads to the status and close-other screens: load them while it opens
  const openMenu = () => {
    void pages.status.preload();
    void pages.closeOther.preload();
    return presentActionSheet({
      header: t('document.menu'),
      buttons: [
        { text: t('document.produceInEnglish'), handler: wip },
        { text: t('document.preview'), handler: wip },
        { text: t('document.print'), handler: wip },
        { text: t('document.printTrueCopy'), handler: wip },
        { text: t('document.share'), handler: share },
        ...(summary && canRemind(summary) ? [{ text: t('document.remindMe'), handler: () => void remind() }] : []),
        { text: t('document.email'), handler: wip },
        { text: t('document.editStatus'), handler: () => router.push(`/documents/${id}/status`) },
        ...(summary?.type === 'quote' ? [{ text: t('document.copyQuote'), handler: wip }] : []),
        { text: t('document.copyDocument'), handler: wip },
        { text: t('document.createPaymentPage'), handler: wip },
        { text: t('document.closeOther'), handler: () => router.push(`/documents/${id}/close-other`) },
        ...(summary && !summary.isCancelled
          ? [{ text: t('document.cancelDocument'), role: 'destructive', handler: () => void handleCancel() }]
          : []),
        { text: t('document.close'), role: 'cancel' },
      ],
    });
  };

  const openCreateMenu = () =>
    presentActionSheet({
      header: t('document.createActions'),
      buttons: [
        { text: t('document.createQuote'), handler: wip },
        { text: t('document.createOther'), handler: wip },
        { text: t('document.createPaymentPage'), handler: wip },
        { text: t('document.copyDocument'), handler: wip },
        { text: t('document.close'), role: 'cancel' },
      ],
    });

  const quickActions = [
    { label: t('document.share'), icon: shareSocialOutline, onClick: share },
    { label: t('document.print'), icon: printOutline, onClick: wip },
    { label: t('document.email'), icon: mailOutline, onClick: wip },
    { label: t('document.delete'), icon: trashOutline, onClick: () => void handleDelete() },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/history" text="" />
          </IonButtons>
          <IonTitle>{summary ? t(`documentType.${summary.type}`) : ''}</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label={t('document.menu')} onClick={() => void openMenu()}>
              <IonIcon slot="icon-only" icon={optionsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <div className="doc-actions">
          {quickActions.map((action) => (
            <button key={action.label} type="button" className="doc-action" onClick={action.onClick}>
              <span className="doc-action__icon">
                <IonIcon icon={action.icon} aria-hidden="true" />
              </span>
              {action.label}
            </button>
          ))}
        </div>
      </IonHeader>

      <IonContent className="doc-content">
        <DocumentHeaderCard document={summary} />

        {document && <DocumentSections document={document} />}
        {!document && !isError && <SectionsSkeleton />}
        {isError && (
          <div className="doc-empty">
            <p>{t('document.loadError')}</p>
            <IonButton fill="outline" onClick={() => void refetch()}>
              {t('common.retry')}
            </IonButton>
          </div>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="start">
          <IonFabButton aria-label={t('document.createActions')} onClick={() => void openCreateMenu()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default DocumentPage;
