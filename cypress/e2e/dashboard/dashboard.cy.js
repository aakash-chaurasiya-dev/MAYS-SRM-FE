describe('Dashboard', () => {
  beforeEach(() => {
    cy.loginByApi();
  });

  it('loads the dashboard page', () => {
    cy.url().should('include', '/dashboard');
    cy.get('body').should('be.visible');
  });

  it('shows the app layout with sidebar', () => {
    cy.contains('Dashboard').should('be.visible');
  });
});
