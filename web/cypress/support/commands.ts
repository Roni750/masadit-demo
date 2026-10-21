/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * The screen on top of Ionic's navigation stack, asserted to be fully shown.
       * Cypress happily clicks and types into transparent elements, so without this a page left
       * at Ionic's `ion-page-invisible` (opacity 0) after a transition would pass every other check.
       */
      currentPage(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// A query (not a command) so Cypress re-runs it while retrying the assertions chained after it,
// e.g. until a page transition finishes
Cypress.Commands.addQuery('currentPage', () => () => {
  const top = Cypress.$('ion-router-outlet > .ion-page:not(.ion-page-hidden)').last();
  return top.hasClass('ion-page-invisible') ? Cypress.$() : top;
});

export {};
