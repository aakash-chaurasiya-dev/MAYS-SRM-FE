describe('Tickets module', () => {
  beforeEach(() => {
    cy.loginBySession();
    cy.intercept('GET', '**/api/**', { statusCode: 200, body: { data: [] } });
    cy.visit('/tickets/new');
  });

  it('loads the new ticket page', () => {
    cy.url().should('include', '/tickets/new');
    cy.get('body').should('be.visible');
  });
});
