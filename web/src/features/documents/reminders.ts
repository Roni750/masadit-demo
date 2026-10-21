import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { TFunction } from 'i18next';
import type { DocumentSummary, DocumentType } from '../../domain/documents';
import { dueDate } from '../../lib/dueDate';

// Documents that are paid on a due date, so a payment reminder makes sense
const PAYABLE_TYPES: DocumentType[] = ['taxInvoice', 'dealInvoice', 'smartInvoice'];

const REMINDER_HOUR = 9;

/** Local notifications are scheduled by the phone itself, so they exist only in the native app */
export const canRemind = (document: DocumentSummary) =>
  Capacitor.isNativePlatform() &&
  PAYABLE_TYPES.includes(document.type) &&
  document.status === 'open' &&
  !document.isCancelled;

export type ReminderResult = { scheduledFor: Date; overdue: boolean } | 'denied';

/**
 * Schedules a reminder for 09:00 on the document's due date (from the client's payment terms).
 * When that's already past, the invoice is overdue and the reminder is set for 09:00 tomorrow.
 * Tapping the notification opens the document (see NotificationRouter).
 */
export const scheduleDueReminder = async (document: DocumentSummary, t: TFunction): Promise<ReminderResult> => {
  let { display } = await LocalNotifications.checkPermissions();
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    ({ display } = await LocalNotifications.requestPermissions());
  }
  if (display !== 'granted') return 'denied';

  const [year, month, day] = dueDate(document.issuedAt, document.client.paymentTerms).split('-').map(Number);
  let at = new Date(year, month - 1, day, REMINDER_HOUR);
  const overdue = at.getTime() <= Date.now();
  if (overdue) {
    at = new Date();
    at.setDate(at.getDate() + 1);
    at.setHours(REMINDER_HOUR, 0, 0, 0);
  }

  const values = { type: t(`documentType.${document.type}`), number: document.number, client: document.client.name };
  await LocalNotifications.schedule({
    notifications: [
      {
        // One reminder per document: scheduling again replaces it
        id: document.id,
        title: t(overdue ? 'reminders.overdueTitle' : 'reminders.dueTitle', values),
        body: t('reminders.body', values),
        schedule: { at, allowWhileIdle: true },
        extra: { documentId: document.id },
      },
    ],
  });
  return { scheduledFor: at, overdue };
};
