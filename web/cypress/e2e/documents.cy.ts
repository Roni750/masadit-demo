// Runs against the dev servers (npm run dev). These tests write, so each one starts by
// resetting the dev database to the demo seed.

// Seed ids (api/db/seed.sql)
const TAX_INVOICE_1000 = 1;
const CREDIT_1000 = 2;
const TAX_INVOICE_1001 = 5;
const QUOTE_1001 = 8;

const card = (id: number) => cy.get(`[data-document-id="${id}"]`);

describe('Document screens', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.viewport('iphone-x');
  });

  it('opens a document from History with its lines and summary', () => {
    cy.visit('/history');
    card(TAX_INVOICE_1000).find('.document-card__body').click();

    cy.location('pathname').should('eq', `/documents/${TAX_INVOICE_1000}`);
    cy.contains('.doc-section', 'מוצרים לחיוב').should('contain', 'מכירות');
    cy.contains('.doc-section', 'סיכום').should('contain', 'מע״מ 17%').and('contain', '11.00');
    cy.screenshot('document-detail', { capture: 'viewport' });
  });

  it('closes an invoice with a credit invoice, reopens it, and History reflects both', () => {
    cy.visit('/history');
    card(TAX_INVOICE_1000).find('.status-pill').click();

    cy.location('pathname').should('eq', `/documents/${TAX_INVOICE_1000}/status`);
    cy.get('[role="checkbox"]').should('have.length', 3).and('have.attr', 'aria-checked', 'false');

    cy.contains('[role="checkbox"]', 'חשבונית זיכוי # 1000').click();
    cy.contains('[role="checkbox"]', 'חשבונית זיכוי # 1000').should('have.attr', 'aria-checked', 'true');
    cy.get('.closing-summary .status-pill').should('have.text', 'סגור');
    cy.get('.closing-summary__balance strong').should('contain', '0.00');
    cy.screenshot('status-closed', { capture: 'viewport' });

    // Back in History, the cached list was invalidated by the write: no stale "open" badge
    cy.go('back');
    card(TAX_INVOICE_1000).find('.status-pill').should('have.text', 'סגור');
    card(CREDIT_1000).find('.status-pill').should('have.text', 'סגור');

    card(TAX_INVOICE_1000).find('.status-pill').click();
    cy.contains('[role="checkbox"]', 'חשבונית זיכוי # 1000').click();
    cy.get('.closing-summary .status-pill').should('have.text', 'פתוח');
  });

  it('closes a document manually', () => {
    cy.visit(`/documents/${TAX_INVOICE_1001}/status`);
    cy.contains('ion-button', 'סגירה ידנית').click();

    cy.contains('[role="checkbox"]', 'סגירה ידנית').should('have.attr', 'aria-checked', 'true');
    cy.get('.closing-summary .status-pill').should('have.text', 'סגור');
    cy.contains('ion-button', 'סגירה ידנית').should('not.exist');
  });

  it('uses a credit invoice to close another document', () => {
    cy.visit(`/documents/${CREDIT_1000}/close-other`);

    cy.get('[role="checkbox"]').should('have.length', 2);
    cy.contains('[role="checkbox"]', 'חשבונית מס # 1001').click();

    // The ₪11 credit is now used up, so nothing else can be closed with it
    cy.contains('[role="checkbox"]', 'חשבונית מס # 1001').should('have.attr', 'aria-checked', 'true');
    cy.get('[role="checkbox"]').should('have.length', 1);
  });

  it('deletes a document after confirmation and returns to History', () => {
    cy.visit('/history');
    card(QUOTE_1001).find('.document-card__body').click();

    cy.contains('.doc-action', 'מחק').click();
    cy.get('ion-alert').contains('button', 'כן').click();

    cy.location('pathname').should('eq', '/history');
    card(QUOTE_1001).should('not.exist');
    cy.get('.document-card').should('have.length', 7);
  });
});
