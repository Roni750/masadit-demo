// The web build reads connectivity from the browser's online/offline events (via Capacitor's Network plugin)

const toastMessages = ($toasts: JQuery<HTMLElement>) =>
  [...$toasts].map((toast) => (toast as HTMLIonToastElement).message);

describe('Offline notice', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.viewport('iphone-x');
    cy.visit('/history');
    cy.get('.document-card').should('have.length', 8);
  });

  it('tells the user when the connection drops and when it returns, keeping loaded data on screen', () => {
    cy.window().then((win) => win.dispatchEvent(new Event('offline')));
    cy.get('ion-toast').should(($toasts) => {
      expect(toastMessages($toasts)).to.include('אין חיבור לאינטרנט, אבל עדיין אפשר לצפות בנתונים שכבר נטענו');
    });
    cy.get('.document-card').should('have.length', 8);
    cy.screenshot('offline', { capture: 'viewport' });

    cy.window().then((win) => win.dispatchEvent(new Event('online')));
    cy.get('ion-toast').should(($toasts) => {
      expect(toastMessages($toasts)).to.include('החיבור חזר');
    });
  });
});
