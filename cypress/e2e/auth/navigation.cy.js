describe('Auth navigation', () => {
  it('redirects unauthenticated users to login', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('redirects root to dashboard after login', () => {
    cy.loginByApi();
    cy.visit('/');
    cy.url().should('include', '/dashboard');
  });
});
