describe('Maintenance module', () => {
  beforeEach(() => {
    cy.loginBySession();
    cy.visit('/maintenance');
  });

  it('loads the maintenance overview page', () => {
    cy.url().should('include', '/maintenance');
    cy.get('body').should('be.visible');
  });
});
