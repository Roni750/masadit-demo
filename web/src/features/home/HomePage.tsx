import { IonContent, IonFooter, IonIcon, IonPage, IonRippleEffect } from '@ionic/react';
import { add, appsOutline, downloadOutline, home, sparkles } from 'ionicons/icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { Logo } from '../../components/Logo';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useWipAlert } from '../../hooks/useWipAlert';
import { formatDate, formatMoney } from '../../lib/format';
import { whenIdle } from '../../lib/lazyPage';
import { tapFeedback } from '../../lib/native';
import { pages, useAppRouter } from '../../pages';
import { useIntlLocale } from '../../state/locale';
import { DEMO_BUSINESS, DEMO_LAST_DOCUMENT, DEMO_STATS, HOME_SECTIONS, type HomeAction } from './homeData';
import './HomePage.css';

const ils = (amount: number) => ({ amount, currency: 'ILS' });

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const router = useAppRouter();
  const showWip = useWipAlert();
  const { canInstall, install } = useInstallPrompt();

  // History is the one working destination: fetch its code while Home sits idle
  useEffect(() => whenIdle(() => void pages.history.preload()), []);

  const open = (action: HomeAction) => {
    void tapFeedback();
    return (action.href ? router.push(action.href) : void showWip());
  };

  return (
    <IonPage>
      <IonContent className="home-content">
        <div className="home-topbar">
          {canInstall && (
            <button type="button" className="home-chip home-install" onClick={() => void install()}>
              <IonIcon icon={downloadOutline} aria-hidden="true" />
              {t('home.install')}
            </button>
          )}
          <LanguageSwitcher />
        </div>
        <header className="home-header">
          <Logo />
          <div className="home-header__business">
            <button type="button" className="home-chip" onClick={() => void showWip()}>
              {t('home.chooseBusiness')}
            </button>
            <strong className="home-header__name">{DEMO_BUSINESS.name}</strong>
            <span className="home-muted">
              {t('home.businessIdLabel')} {DEMO_BUSINESS.id} | {DEMO_BUSINESS.kind}
            </span>
            <span className="home-muted">{DEMO_BUSINESS.company}</span>
          </div>
        </header>

        <div className="home-banner">{t('home.welcome')}</div>

        <div className="home-stats">
          {DEMO_STATS.map((stat) => (
            <div key={stat.labelKey} className="home-card home-stat">
              <span className="home-muted">{t(stat.labelKey)}</span>
              <strong>{formatMoney(ils(stat.amount), locale)}</strong>
            </div>
          ))}
        </div>

        <button type="button" className="home-card home-last-document ion-activatable" onClick={() => void showWip()}>
          <span className="home-muted">{t('home.lastDocument')}</span>
          <span className="home-last-document__row">
            <span>
              {t(DEMO_LAST_DOCUMENT.typeKey)} | {formatDate(DEMO_LAST_DOCUMENT.date, locale)} | {DEMO_LAST_DOCUMENT.client}
            </span>
            <strong>{formatMoney(ils(DEMO_LAST_DOCUMENT.amount), locale)}</strong>
          </span>
          <IonRippleEffect />
        </button>

        {HOME_SECTIONS.map((section) => (
          <section key={section.key} className="home-section" aria-labelledby={`home-section-${section.key}`}>
            <h2 id={`home-section-${section.key}`} className="home-section__title">
              {t(`home.sections.${section.key}`)}
            </h2>
            <div className="home-card home-actions" style={{ '--action-color': section.color } as React.CSSProperties}>
              {section.actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className="home-action"
                  data-action={`${section.key}-${action.key}`}
                  onPointerDown={action.href ? () => void pages.history.preload() : undefined}
                  onClick={() => open(action)}
                >
                  <span className="home-action__icon ion-activatable">
                    <IonIcon icon={action.icon} aria-hidden="true" />
                    <IonRippleEffect type="unbounded" />
                  </span>
                  <span className="home-action__label">{t(`home.actions.${action.key}`)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </IonContent>

      <IonFooter className="home-tabbar">
        <nav className="home-tabbar__inner">
          <button type="button" className="home-tab home-tab--active" aria-current="page">
            <IonIcon icon={home} aria-hidden="true" />
            {t('home.tabs.home')}
          </button>
          <button type="button" className="home-tab" onClick={() => void showWip()}>
            <IonIcon icon={appsOutline} aria-hidden="true" />
            {t('home.tabs.myBusiness')}
          </button>
          <button type="button" className="home-tab" onClick={() => void showWip()}>
            <IonIcon icon={sparkles} aria-hidden="true" />
            {t('home.tabs.ai')}
          </button>
          <button type="button" className="home-fab" aria-label={t('home.tabs.new')} onClick={() => void showWip()}>
            <IonIcon icon={add} aria-hidden="true" />
          </button>
        </nav>
      </IonFooter>
    </IonPage>
  );
};

export default HomePage;
