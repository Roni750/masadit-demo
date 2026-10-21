// Every in-app transition must end with the new screen actually shown. Screens are code-split,
// and a page that loads at the wrong moment can stay transparent after Ionic's transition (see lib/lazyPage.ts).

describe('Navigation', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.viewport('iphone-x');
  });

  it('shows each screen after navigating to it, and again after going back', () => {
    cy.visit('/home');
    cy.currentPage().should('contain', 'ברוך הבא');

    cy.get('[data-action="invoices-history"]').click();
    cy.location('pathname').should('eq', '/history');
    cy.currentPage().find('.document-card').should('have.length', 8);

    cy.get('[data-document-id="1"] .document-card__body').click();
    cy.location('pathname').should('eq', '/documents/1');
    cy.currentPage().should('contain', 'מוצרים לחיוב');

    cy.currentPage().find('.doc-header .status-pill').click();
    cy.location('pathname').should('eq', '/documents/1/status');
    cy.currentPage().should('contain', 'נותר פתוח');

    cy.go('back');
    cy.location('pathname').should('eq', '/documents/1');
    cy.currentPage().should('contain', 'מוצרים לחיוב');

    cy.currentPage().contains('.doc-link', 'Air Dell').click();
    cy.location('pathname').should('eq', '/clients/1');
    cy.currentPage().find('.client-details').should('contain', 'Air Dell');

    cy.currentPage().find('ion-button[data-action="edit"]').click();
    cy.location('pathname').should('eq', '/clients/1/edit');
    cy.currentPage().find('ion-input[data-field="name"]').should('be.visible');
  });

  it('shows a screen opened directly by its URL', () => {
    cy.visit('/documents/1/close-other');
    cy.currentPage().should('contain', 'סגירת מסמך אחר');
  });
});
