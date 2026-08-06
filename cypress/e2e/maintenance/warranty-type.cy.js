describe('Warranty Type management', () => {
  beforeEach(() => {
    cy.loginBySession();
    cy.mockMaintenanceApis();
    cy.visit('/maintenance/warranty-type');
    cy.wait('@warrantyTypes');
    cy.wait('@ticketTypes');
  });

  it('loads the warranty type page', () => {
    cy.url().should('include', '/maintenance/warranty-type');
    cy.contains('Warranty Type Restructuring').should('be.visible');
  });

  it('displays warranty types in the list', () => {
    cy.contains('Standard Warranty').should('be.visible');
  });

  it('opens create modal when add is clicked', () => {
    cy.contains('button', 'Add Warranty Type').click();
    cy.contains('Add New Warranty Type').should('be.visible');
  });
});
