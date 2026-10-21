import { Capacitor } from '@capacitor/core';
import type { TFunction } from 'i18next';
import { fetchDocuments } from '../../api/documents';
import type { DocumentFilter, DocumentSummary } from '../../domain/documents';
import { dueDate } from '../../lib/dueDate';

const EXPORT_PAGE_SIZE = 50;

// The feed loads page by page; an export needs every matching document
const fetchAllDocuments = async (filter: DocumentFilter) => {
  const documents: DocumentSummary[] = [];
  for (let page = 1; ; page += 1) {
    const result = await fetchDocuments(filter, page, EXPORT_PAGE_SIZE);
    documents.push(...result.items);
    if (!result.hasMore) return documents;
  }
};

// 'YYYY-MM-DD' → a Date at UTC midnight, which Excel shows as that calendar day
const excelDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

interface ExportOptions {
  filter: DocumentFilter;
  /** Adds due dates (from the client's payment terms) and recipient emails */
  detailed: boolean;
  t: TFunction;
  rightToLeft: boolean;
}

const buildWorkbook = async (documents: DocumentSummary[], { detailed, t, rightToLeft }: ExportOptions) => {
  // Loaded only when exporting, so the library adds nothing to the app's startup bundle
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(t('history.title'), {
    views: [{ rightToLeft, state: 'frozen', ySplit: 1 }],
  });

  const money = '#,##0.00';
  sheet.columns = [
    { header: t('export.type'), key: 'type', width: 22 },
    { header: t('export.number'), key: 'number', width: 10 },
    { header: t('export.date'), key: 'date', width: 13, style: { numFmt: 'dd/mm/yyyy' } },
    { header: t('export.client'), key: 'client', width: 24 },
    { header: t('export.status'), key: 'status', width: 10 },
    { header: t('export.totalIls'), key: 'totalIls', width: 14, style: { numFmt: money } },
    { header: t('export.vatIls'), key: 'vatIls', width: 12, style: { numFmt: money } },
    { header: t('export.openBalanceIls'), key: 'openBalanceIls', width: 14, style: { numFmt: money } },
    { header: t('export.currency'), key: 'currency', width: 9 },
    { header: t('export.totalOriginal'), key: 'totalOriginal', width: 14, style: { numFmt: money } },
    ...(detailed
      ? [
          { header: t('export.dueDate'), key: 'dueDate', width: 13, style: { numFmt: 'dd/mm/yyyy' } },
          { header: t('export.recipient'), key: 'recipient', width: 28 },
        ]
      : []),
  ];

  for (const document of documents) {
    sheet.addRow({
      type: t(`documentType.${document.type}`),
      number: document.number,
      date: excelDate(document.issuedAt),
      client: document.client.name,
      status: t(`status.${document.isCancelled ? 'cancelled' : document.status}`),
      totalIls: document.totalIls.amount,
      vatIls: document.vatIls.amount,
      openBalanceIls: document.openBalanceIls.amount,
      currency: document.total.currency,
      totalOriginal: document.total.amount,
      dueDate: excelDate(dueDate(document.issuedAt, document.client.paymentTerms)),
      recipient: document.client.email ?? '',
    });
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F6FD0' } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };

  return workbook.xlsx.writeBuffer();
};

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const toBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

// Web: a regular download. Native: browsers' download links don't work inside the app's WebView,
// so the file is written to the app's cache and handed to the system share sheet (save, mail, WhatsApp…).
const saveFile = async (buffer: ArrayBuffer, fileName: string, shareTitle: string) => {
  if (Capacitor.isNativePlatform()) {
    const [{ Directory, Filesystem }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const { uri } = await Filesystem.writeFile({ path: fileName, data: toBase64(buffer), directory: Directory.Cache });
    await Share.share({ title: shareTitle, files: [uri] });
    return;
  }

  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_MIME }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportDocuments = async (options: ExportOptions) => {
  const documents = await fetchAllDocuments(options.filter);
  const buffer = await buildWorkbook(documents, options);
  const today = new Date().toISOString().slice(0, 10);
  const fileName = `documents${options.detailed ? '-detailed' : ''}-${today}.xlsx`;
  await saveFile(buffer as ArrayBuffer, fileName, options.t('history.exportExcel'));
  return documents.length;
};
