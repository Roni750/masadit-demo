// Runs against the dev servers (npm run dev); each test starts from the demo seed

const TAX_INVOICE_1000 = 1;

describe('Client card', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.viewport('iphone-x');
  });

  it('opens from a document and shows details, documents and ledger', () => {
    cy.visit(`/documents/${TAX_INVOICE_1000}`);
    cy.contains('.doc-link', 'Air Dell').click();

    cy.location('pathname').should('eq', '/clients/1');
    cy.get('.client-details').should('contain', 'Air Dell');

    cy.contains('ion-segment-button', 'מעקב מסמכים').click();
    cy.get('.ion-page:not(.ion-page-hidden) .document-card').should('have.length', 8);
    cy.contains('ion-segment-button', 'סגור').click();
    cy.get('.ion-page:not(.ion-page-hidden) .document-card').should('have.length', 1);

    cy.contains('ion-segment-button', 'כרטסת').click();
    cy.get('.ledger-balance').should('contain', '10.98');
    cy.get('.ledger-entry').should('have.length', 7);
    cy.screenshot('client-ledger', { capture: 'viewport' });
  });

  it('edits the client, validates input, and the new name shows on document cards', () => {
    cy.visit('/clients/1');
    cy.get('.client-details').should('contain', 'Air Dell');
    cy.get('ion-button[data-action="edit"]').click();

    cy.location('pathname').should('eq', '/clients/1/edit');
    cy.contains('ion-button', 'שמור').should('have.attr', 'disabled');

    cy.get('ion-input[data-field="email"] input').type('not-an-email').blur();
    cy.contains('מייל לא תקינה').should('exist');
    cy.get('ion-input[data-field="email"] input').clear().type('billing@airdell.example');

    cy.get('ion-input[data-field="name"] input').clear().type('Air Dell Ltd');
    cy.screenshot('client-edit', { capture: 'viewport' });
    cy.contains('ion-button', 'שמור').click();

    cy.location('pathname').should('eq', '/clients/1');
    cy.get('.client-details').should('contain', 'Air Dell Ltd').and('contain', 'billing@airdell.example');

    cy.visit('/history');
    cy.get('.document-card').first().should('contain', 'Air Dell Ltd');
  });

  it('asks before leaving with unsaved changes', () => {
    cy.visit('/clients/1');
    cy.get('.client-details').should('contain', 'Air Dell');
    cy.get('ion-button[data-action="edit"]').click();
    cy.get('ion-input[data-field="name"] input').clear().type('Changed');

    cy.get('ion-button[data-action="back"]').click();
    cy.get('ion-alert').should('contain', 'האם לצאת ללא שמירה?').contains('button', 'לא').click();
    cy.location('pathname').should('eq', '/clients/1/edit');
    cy.get('ion-alert').should('not.exist');

    cy.get('ion-button[data-action="back"]').click();
    cy.get('ion-alert').contains('button', 'כן').click();
    cy.location('pathname').should('eq', '/clients/1');
    cy.get('.client-details').should('contain', 'Air Dell').and('not.contain', 'Changed');
  });
});
