import {
  briefcase,
  calculator,
  card,
  cardOutline,
  cashOutline,
  cloudDownloadOutline,
  cloudUploadOutline,
  createOutline,
  cubeOutline,
  documentTextOutline,
  folderOpen,
  idCardOutline,
  listOutline,
  newspaperOutline,
  people,
  pricetags,
  scanOutline,
  settingsSharp,
  timeOutline,
  umbrellaOutline,
} from 'ionicons/icons';

// The Home screen is a UI replica (the assignment scope): the business details and figures
// below are static demo values, not data from the API.
export const DEMO_BUSINESS = {
  name: 'סתם שתיים',
  id: '033784034',
  kind: 'סתיים',
  company: 'וויבנפיט מערכות בע״מ',
};

export const DEMO_STATS = [
  { labelKey: 'home.incomeCurrentMonth', amount: 66.01 },
  { labelKey: 'home.incomePreviousMonth', amount: 0 },
  { labelKey: 'home.incomeCurrentYear', amount: 66.01 },
] as const;

export const DEMO_LAST_DOCUMENT = { typeKey: 'documentType.quote', date: '2026-10-20', client: 'Air Dell', amount: 0 };

export interface HomeAction {
  key: string;
  icon: string;
  /** Route for the actions that work; everything else shows the work-in-progress alert */
  href?: string;
}

export interface HomeSection {
  key: string;
  color: string;
  actions: HomeAction[];
}

export const HOME_SECTIONS: HomeSection[] = [
  {
    key: 'invoices',
    color: '#3a3a3a',
    actions: [
      { key: 'invoice', icon: createOutline },
      { key: 'history', icon: timeOutline, href: '/history' },
      { key: 'clients', icon: people },
      { key: 'settings', icon: settingsSharp },
    ],
  },
  {
    key: 'scans',
    color: '#2f6fd0',
    actions: [
      { key: 'expenses', icon: cloudUploadOutline },
      { key: 'income', icon: cloudDownloadOutline },
      { key: 'other', icon: scanOutline },
      { key: 'tracking', icon: listOutline },
    ],
  },
  {
    key: 'clearing',
    color: '#5b9e2f',
    actions: [
      { key: 'quickClearing', icon: cardOutline },
      { key: 'paymentPage', icon: cashOutline },
      { key: 'standingOrder', icon: documentTextOutline },
      { key: 'tracking', icon: card },
    ],
  },
  {
    key: 'management',
    color: '#a5521b',
    actions: [
      { key: 'files', icon: folderOpen },
      { key: 'greenSignature', icon: createOutline },
      { key: 'businessCard', icon: idCardOutline },
      { key: 'savings', icon: cubeOutline },
    ],
  },
  {
    key: 'reports',
    color: '#3fb0ae',
    actions: [
      { key: 'reports', icon: newspaperOutline },
      { key: 'profitLoss', icon: newspaperOutline },
      { key: 'income', icon: newspaperOutline },
      { key: 'expenses', icon: newspaperOutline },
    ],
  },
  {
    key: 'calculators',
    color: '#333333',
    actions: [
      { key: 'taxAdvances', icon: pricetags },
      { key: 'nationalInsurance', icon: umbrellaOutline },
      { key: 'employerCost', icon: briefcase },
      { key: 'calculators', icon: calculator },
    ],
  },
];
