// Runs against the dev servers (npm run dev); each test starts from the demo seed

describe('History', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.viewport('iphone-x');
    cy.visit('/history');
  });

  it('shows the feed with per-type totals', () => {
    cy.get('.document-card').should('have.length', 8);
    cy.get('.type-totals__row').should('have.length', 4);
    cy.contains('.type-totals__row', 'חשבונית זיכוי').should('contain', '33.00');
    cy.contains('.document-card', 'חשבונית מס קבלה').find('.status-pill').should('have.text', 'סגור');
    cy.screenshot('history-all', { capture: 'viewport' });
  });

  it('filters by document type and returns to all', () => {
    cy.get('.document-card').should('have.length', 8);

    cy.contains('.type-totals__row', 'חשבונית זיכוי').click();
    cy.get('.document-card').should('have.length', 3).each((card) => {
      cy.wrap(card).should('contain', 'זיכוי חשבונית מס מספר 1000');
    });
    cy.screenshot('history-filtered', { capture: 'viewport' });

    cy.contains('button', 'הצג הכל').click();
    cy.get('.document-card').should('have.length', 8);
  });

  it('exports the filtered documents to an RTL Excel file with due dates', () => {
    cy.task('clearDownloads');
    cy.contains('.type-totals__row', 'חשבונית זיכוי').click();
    cy.get('.document-card').should('have.length', 3);

    cy.get('ion-button[data-action="actions"]').click();
    cy.contains('ion-action-sheet button', 'כולל מועדים ונמענים').click();
    // The toast's text renders inside its shadow DOM, so assert on its message property
    cy.get('ion-toast').should(($toasts) => {
      expect([...$toasts].map((toast) => (toast as HTMLIonToastElement).message)).to.include('הקובץ מוכן (3 מסמכים)');
    });

    cy.task('readDownloadedWorkbook').then((workbook) => {
      const { file, rightToLeft, rows } = workbook as { file: string; rightToLeft: boolean; rows: unknown[][] };
      expect(file).to.match(/^documents-detailed-\d{4}-\d{2}-\d{2}\.xlsx$/);
      expect(rightToLeft).to.equal(true);
      expect(rows[0]).to.include('סוג מסמך').and.include('מועד תשלום');
      expect(rows).to.have.length(4);
      // A credit invoice issued 13/06/2021 for a client on "current" terms is due at the end of that month
      expect(rows[1][0]).to.equal('חשבונית זיכוי');
      expect(rows[1][10]).to.equal('2021-06-30T00:00:00.000Z');
    });
  });

  it('searches by document number', () => {
    cy.get('.document-card').should('have.length', 8);
    cy.get('ion-searchbar input').type('1002');
    cy.get('.document-card').should('have.length', 1).and('contain', '# 1002');
  });
});
