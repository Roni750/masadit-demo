import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  useIonRouter,
  useIonToast,
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PAYMENT_TERMS, type Client, type ClientChanges, type PaymentTerms } from '../../domain/clients';
import { useConfirm } from '../../hooks/useConfirm';
import { useErrorToast } from '../../hooks/useErrorToast';
import { useHardwareBackGuard } from '../../hooks/useHardwareBackGuard';
import { useClient, useUpdateClient } from './queries';
import '../documents/documents.css';
import './clients.css';

const TEXT_FIELDS = [
  'name',
  'taxId',
  'phone',
  'mobile',
  'fax',
  'email',
  'deliveryEmail',
  'contactName',
  'street',
  'houseNumber',
  'city',
  'zip',
  'poBox',
  'country',
  'balanceCode',
  'sortCode',
  'openingBalance',
] as const;

type TextField = (typeof TEXT_FIELDS)[number];
type FormValues = Record<TextField, string> & { paymentTerms: PaymentTerms; isActive: boolean };

const SECTIONS: { fields: TextField[]; withSelects?: boolean }[] = [
  { fields: ['name', 'taxId'], withSelects: true },
  { fields: ['phone', 'mobile', 'fax', 'email', 'deliveryEmail', 'contactName'] },
  { fields: ['street', 'houseNumber', 'city', 'zip', 'poBox', 'country'] },
  { fields: ['balanceCode', 'sortCode', 'openingBalance'] },
];

const INPUT_TYPE: Partial<Record<TextField, 'email' | 'tel' | 'text'>> = {
  phone: 'tel',
  mobile: 'tel',
  fax: 'tel',
  email: 'email',
  deliveryEmail: 'email',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMOUNT_PATTERN = /^-?\d{1,10}(\.\d{1,2})?$/;

const toFormValues = (client: Client): FormValues => ({
  name: client.name,
  taxId: client.taxId ?? '',
  phone: client.phone ?? '',
  mobile: client.mobile ?? '',
  fax: client.fax ?? '',
  email: client.email ?? '',
  deliveryEmail: client.deliveryEmail ?? '',
  contactName: client.contactName ?? '',
  street: client.address.street ?? '',
  houseNumber: client.address.houseNumber ?? '',
  city: client.address.city ?? '',
  zip: client.address.zip ?? '',
  poBox: client.address.poBox ?? '',
  country: client.address.country ?? '',
  balanceCode: client.balanceCode ?? '',
  sortCode: client.sortCode ?? '',
  openingBalance: client.openingBalance.amount.toFixed(2),
  paymentTerms: client.paymentTerms,
  isActive: client.isActive,
});

const toChanges = (values: FormValues): ClientChanges => {
  const text = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    taxId: text(values.taxId),
    paymentTerms: values.paymentTerms,
    isActive: values.isActive,
    phone: text(values.phone),
    mobile: text(values.mobile),
    fax: text(values.fax),
    email: text(values.email),
    deliveryEmail: text(values.deliveryEmail),
    contactName: text(values.contactName),
    address: {
      street: text(values.street),
      houseNumber: text(values.houseNumber),
      city: text(values.city),
      zip: text(values.zip),
      poBox: text(values.poBox),
      country: text(values.country),
    },
    balanceCode: text(values.balanceCode),
    sortCode: text(values.sortCode),
    openingBalance: { amount: Number(values.openingBalance || 0), currency: 'ILS' },
  };
};

// Returns translation keys of validation messages, by field
const validate = (values: FormValues): Partial<Record<TextField, string>> => {
  const errors: Partial<Record<TextField, string>> = {};
  if (!values.name.trim()) errors.name = 'clients.validation.required';
  for (const field of ['email', 'deliveryEmail'] as const) {
    if (values[field].trim() && !EMAIL_PATTERN.test(values[field].trim())) errors[field] = 'clients.validation.email';
  }
  if (values.openingBalance.trim() && !AMOUNT_PATTERN.test(values.openingBalance.trim())) {
    errors.openingBalance = 'clients.validation.amount';
  }
  return errors;
};

const ClientEditPage: React.FC = () => {
  const id = Number(useParams().id);
  const { t } = useTranslation();
  const router = useIonRouter();
  const confirm = useConfirm();
  const showError = useErrorToast();
  const [presentToast] = useIonToast();
  const client = useClient(id);
  const updateClient = useUpdateClient(id);

  const initial = useMemo(() => (client.data ? toFormValues(client.data) : null), [client.data]);
  const [values, setValues] = useState<FormValues | null>(null);
  const [touched, setTouched] = useState<Partial<Record<TextField, boolean>>>({});

  // Fill the form once the client arrives (instantly when it's already cached from the client card)
  useEffect(() => {
    if (initial && !values) setValues(initial);
  }, [initial, values]);

  const dirty = !!values && !!initial && JSON.stringify(values) !== JSON.stringify(initial);
  const errors = values ? validate(values) : {};
  const valid = Object.keys(errors).length === 0;

  const leave = () => (router.canGoBack() ? router.goBack() : router.push(`/clients/${id}`, 'back', 'replace'));

  const requestLeave = async () => {
    if (!dirty || (await confirm(t('clients.leaveConfirm')))) leave();
  };

  useHardwareBackGuard(dirty, () => void requestLeave());

  const save = () => {
    if (!values) return;
    if (!valid) {
      setTouched(Object.fromEntries(TEXT_FIELDS.map((field) => [field, true])));
      return;
    }
    updateClient.mutate(toChanges(values), {
      onSuccess: () => {
        void presentToast({ message: t('clients.saved'), duration: 1500, position: 'bottom' });
        leave();
      },
      onError: showError,
    });
  };

  const setField = (field: keyof FormValues, value: string | boolean) =>
    setValues((current) => (current ? { ...current, [field]: value } : current));

  const textInput = (field: TextField) => {
    const error = touched[field] && errors[field];
    return (
      <IonItem key={field} lines="full">
        <IonInput
          data-field={field}
          label={t(`clients.fields.${field}`)}
          labelPlacement="stacked"
          type={INPUT_TYPE[field] ?? 'text'}
          inputmode={field === 'openingBalance' ? 'decimal' : undefined}
          value={values?.[field]}
          className={error ? 'ion-invalid ion-touched' : undefined}
          errorText={error ? t(error) : undefined}
          onIonInput={(event) => setField(field, String(event.detail.value ?? ''))}
          onIonBlur={() => setTouched((current) => ({ ...current, [field]: true }))}
        />
      </IonItem>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            {/* A plain button rather than IonBackButton, so leaving can be confirmed first */}
            <IonButton data-action="back" aria-label={t('common.back')} onClick={() => void requestLeave()}>
              <IonIcon slot="icon-only" icon={arrowBack} flipRtl />
            </IonButton>
          </IonButtons>
          <IonTitle>{t('clients.editTitle')}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={!dirty || updateClient.isPending} onClick={save}>
              {t('clients.save')}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="doc-content client-form">
        {!values &&
          [0, 1].map((key) => (
            <section key={key} className="doc-section" aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <div key={row} className="doc-row">
                  <IonSkeletonText animated style={{ width: '60%' }} />
                </div>
              ))}
            </section>
          ))}

        {values &&
          SECTIONS.map((section, index) => (
            <IonList key={index} className="doc-section" lines="full">
              {section.fields.slice(0, 2).map(textInput)}
              {section.withSelects && (
                <>
                  <IonItem lines="full">
                    <IonSelect
                      label={t('clients.fields.paymentTerms')}
                      labelPlacement="stacked"
                      interface="action-sheet"
                      value={values.paymentTerms}
                      onIonChange={(event) => setField('paymentTerms', event.detail.value)}
                    >
                      {PAYMENT_TERMS.map((terms) => (
                        <IonSelectOption key={terms} value={terms}>
                          {t(`clients.paymentTerms.${terms}`)}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                  <IonItem lines="full">
                    <IonSelect
                      label={t('clients.fields.status')}
                      labelPlacement="stacked"
                      interface="popover"
                      value={values.isActive ? 'active' : 'inactive'}
                      onIonChange={(event) => setField('isActive', event.detail.value === 'active')}
                    >
                      <IonSelectOption value="active">{t('clients.status.active')}</IonSelectOption>
                      <IonSelectOption value="inactive">{t('clients.status.inactive')}</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </>
              )}
              {section.fields.slice(2).map(textInput)}
            </IonList>
          ))}
      </IonContent>
    </IonPage>
  );
};

export default ClientEditPage;
