import { IonContent, IonHeader, IonPage, IonSkeletonText, IonToolbar } from '@ionic/react';

// Shown while a screen's code chunk loads. It's a real IonPage so Ionic's page transition
// has something page-shaped to animate; preloading usually means it's never seen at all.
export const PageFallback: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar color="primary" />
    </IonHeader>
    <IonContent style={{ '--background': 'var(--app-page-background)' } as React.CSSProperties}>
      {[0, 1, 2].map((key) => (
        <div key={key} style={{ margin: 12, padding: 16, borderRadius: 6, background: 'var(--app-card-background)' }}>
          <IonSkeletonText animated style={{ width: '45%', height: 18 }} />
          <IonSkeletonText animated style={{ width: '30%' }} />
          <IonSkeletonText animated style={{ width: '60%' }} />
        </div>
      ))}
    </IonContent>
  </IonPage>
);
