import { IonSkeletonText } from '@ionic/react';
import './DocumentCard.css';

// Shaped like DocumentCard so the layout doesn't jump when data arrives
export const DocumentCardSkeleton: React.FC = () => (
  <div className="document-card" aria-hidden="true">
    <div className="document-card__body">
      <div>
        <IonSkeletonText animated style={{ width: '45%', height: 18 }} />
        <IonSkeletonText animated style={{ width: '20%' }} />
        <IonSkeletonText animated style={{ width: '35%' }} />
        <IonSkeletonText animated style={{ width: '50%' }} />
      </div>
      <div style={{ width: 72 }}>
        <IonSkeletonText animated style={{ width: '100%' }} />
        <IonSkeletonText animated style={{ width: '70%' }} />
      </div>
    </div>
    <div className="document-card__status">
      <IonSkeletonText animated style={{ width: 64, height: 30, borderRadius: 999 }} />
    </div>
  </div>
);
