// Offline write policy and the web side of the native-feel features.
// Native-only features (biometric lock, reminders, status bar) can't run in a browser.

const TAX_INVOICE_1000 = 1;

const toastMessages = ($toasts: JQuery<HTMLElement>) =>
  [...$toasts].map((toast) => (toast as HTMLIonToastElement).message);

const goOffline = () => cy.window().then((win) => win.dispatchEvent(new Event('offline')));
const goOnline = () => cy.window().then((win) => win.dispatchEvent(new Event('online')));

describe('Offline writes', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.viewport('iphone-x');
  });

  it('blocks closing a document while offline, without sending anything', () => {
    cy.visit(`/documents/${TAX_INVOICE_1000}/status`);
    cy.get('[role="checkbox"]').should('have.length', 3);

    goOffline();
    cy.contains('[role="checkbox"]', 'חשבונית זיכוי # 1000').click();

    cy.get('ion-toast').should(($toasts) => {
      expect(toastMessages($toasts)).to.include('הפעולה הזו דורשת חיבור לאינטרנט');
    });
    cy.request('/documents/1').its('status').should('eq', 200);
    cy.request('http://localhost:3001/documents/1').its('body.status').should('eq', 'open');
  });

  it('queues a client edit while offline and sends it when the connection returns', () => {
    cy.visit('/clients/1');
    cy.get('.client-details').should('contain', 'Air Dell');
    cy.get('ion-button[data-action="edit"]').click();
    cy.get('ion-input[data-field="name"] input').clear().type('Air Dell Offline');

    goOffline();
    cy.contains('ion-button', 'שמור').click();

    // The card shows the change immediately, while the server still has the old name
    cy.location('pathname').should('eq', '/clients/1');
    cy.get('.client-details').should('contain', 'Air Dell Offline');
    cy.request('http://localhost:3001/clients/1').its('body.name').should('eq', 'Air Dell');

    // Back online, TanStack replays the paused request; poll the API until it has arrived
    goOnline();
    const expectServerName = (name: string, attempts = 10): void => {
      cy.request('http://localhost:3001/clients/1').then((response) => {
        if (response.body.name === name) return;
        if (attempts <= 1) throw new Error(`The server still has "${response.body.name}", expected "${name}"`);
        cy.wait(500).then(() => expectServerName(name, attempts - 1));
      });
    };
    expectServerName('Air Dell Offline');
  });
});

describe('Native-feel features on the web', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.viewport('iphone-x');
  });

  // In English (LTR): Ionic's programmatic open() mishandles RTL sides, though finger swipes don't use it
  it('swipes a card to its quick actions', () => {
    cy.visit('/home');
    cy.get('[data-language="en"]').click();
    cy.visit('/history');
    cy.get('html').should('have.attr', 'dir', 'ltr');
    cy.get(`ion-item-sliding[data-document-id="${TAX_INVOICE_1000}"]`).then(($sliding) => {
      void ($sliding[0] as HTMLIonItemSlidingElement).open('end');
    });
    cy.contains(`ion-item-sliding[data-document-id="${TAX_INVOICE_1000}"] ion-item-option`, 'Edit document status').click();
    cy.location('pathname').should('eq', `/documents/${TAX_INVOICE_1000}/status`);
  });

  it('shares a document, falling back to the clipboard without a share sheet', () => {
    cy.visit(`/documents/${TAX_INVOICE_1000}`, {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'share', { value: undefined, configurable: true });
        cy.stub(win.navigator.clipboard, 'writeText').as('copy').resolves();
      },
    });
    cy.contains('.doc-section', 'מוצרים לחיוב');
    cy.contains('.doc-action', 'שתף').click();

    cy.get('@copy').should('have.been.calledWithMatch', /חשבונית מס #1000[\s\S]*Air Dell/);
    cy.get('ion-toast').should(($toasts) => {
      expect(toastMessages($toasts)).to.include('פרטי המסמך הועתקו');
    });
  });

  it('offers installing the PWA when the browser allows it', () => {
    cy.visit('/home');
    // Wait for Home to mount, so its install listener is registered before the event fires
    cy.get('.home-banner').should('exist');
    cy.get('.home-install').should('not.exist');

    const prompt = cy.stub().resolves();
    cy.window().then((win) => {
      const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });
      win.dispatchEvent(event);
    });

    cy.contains('.home-install', 'התקן אפליקציה').click();
    cy.wrap(prompt).should('have.been.calledOnce');
    cy.get('.home-install').should('not.exist');
  });

  it('keeps native-only actions out of the web version', () => {
    cy.visit(`/documents/${TAX_INVOICE_1000}`);
    cy.contains('.doc-section', 'מוצרים לחיוב');
    cy.get('ion-button[aria-label="אפשרויות מסמך"], ion-toolbar ion-buttons[slot="end"] ion-button').first().click();
    cy.get('ion-action-sheet').should('exist').and('not.contain', 'תזכיר לי במועד התשלום');
  });
});
