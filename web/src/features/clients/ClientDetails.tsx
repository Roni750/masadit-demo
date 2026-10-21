import { IonIcon, IonSkeletonText } from '@ionic/react';
import { call, location, mail, phonePortrait, print } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { formatAddress, type Client } from '../../domain/clients';
import './clients.css';

interface DetailRow {
  label: string;
  value: string | null;
  icon: string;
  color: string;
  /** tel: / mailto: link when the value is present */
  href?: string;
}

export const ClientDetails: React.FC<{ client: Client | undefined }> = ({ client }) => {
  const { t } = useTranslation();

  if (!client) {
    return (
      <section className="doc-section client-details" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((key) => (
          <div key={key} className="client-detail">
            <IonSkeletonText animated style={{ width: '60%' }} />
          </div>
        ))}
      </section>
    );
  }

  const rows: DetailRow[] = [
    { label: t('clients.fields.address'), value: formatAddress(client.address), icon: location, color: '#e5534b' },
    { label: t('clients.fields.phone'), value: client.phone, icon: call, color: '#43a047', href: `tel:${client.phone}` },
    {
      label: t('clients.fields.mobile'),
      value: client.mobile,
      icon: phonePortrait,
      color: '#7cb8a8',
      href: `tel:${client.mobile}`,
    },
    { label: t('clients.fields.fax'), value: client.fax, icon: print, color: '#9b59d0' },
    { label: t('clients.fields.email'), value: client.email, icon: mail, color: '#f2b84b', href: `mailto:${client.email}` },
  ];

  return (
    <section className="doc-section client-details">
      <div className="client-detail client-detail--name">
        <span className="client-detail__label">{t('clients.fields.name')}</span>
        <strong>{client.name}</strong>
        {!client.isActive && <span className="client-detail__badge">{t('clients.inactive')}</span>}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="client-detail">
          <span className="client-detail__label">{row.label}</span>
          {row.value && row.href ? (
            <a className="client-detail__value client-detail__link" href={row.href}>
              {row.value}
            </a>
          ) : (
            <span className="client-detail__value">{row.value ?? t('clients.empty')}</span>
          )}
          <span className="client-detail__icon" style={{ background: row.color }} aria-hidden="true">
            <IonIcon icon={row.icon} />
          </span>
        </div>
      ))}
    </section>
  );
};
