// Home is a UI replica: only History navigates, the rest shows the work-in-progress alert

describe('Home', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.clearLocalStorage();
    cy.visit('/home');
  });

  it('renders the Hebrew replica right-to-left', () => {
    cy.get('html').should('have.attr', 'dir', 'rtl').and('have.attr', 'lang', 'he');
    cy.contains('.home-banner', 'ברוך הבא לאפליקציית ניהול העסק שלך');
    cy.get('.home-action').should('have.length', 24);
    cy.screenshot('home-he', { capture: 'viewport' });
  });

  it('opens History from the invoices section', () => {
    cy.get('[data-action="invoices-history"]').click();
    cy.location('pathname').should('eq', '/history');
    cy.get('.document-card').should('exist');
  });

  it('shows the work-in-progress alert for out-of-scope actions', () => {
    cy.get('[data-action="scans-expenses"]').click();
    cy.get('ion-alert').should('contain', 'הפיצ׳ר הזה עדיין בפיתוח');
  });

  it('switches language and direction, and remembers the choice', () => {
    cy.get('[data-language="en"]').click();

    cy.get('html').should('have.attr', 'dir', 'ltr').and('have.attr', 'lang', 'en');
    cy.contains('.home-banner', 'Welcome to your business management app');
    cy.get('[data-action="invoices-history"]').should('contain', 'History');
    cy.screenshot('home-en', { capture: 'viewport' });

    cy.reload();
    cy.get('html').should('have.attr', 'dir', 'ltr');

    cy.get('[data-action="invoices-history"]').click();
    cy.contains('ion-title', 'My feed');
    cy.get('.document-card').should('exist');
    cy.screenshot('history-en', { capture: 'viewport' });

    cy.go('back');
    cy.get('[data-language="es"]').click();
    cy.get('html').should('have.attr', 'dir', 'ltr').and('have.attr', 'lang', 'es');
    cy.contains('.home-banner', 'Bienvenido');

    cy.get('[data-language="he"]').click();
    cy.get('html').should('have.attr', 'dir', 'rtl');
  });
});
