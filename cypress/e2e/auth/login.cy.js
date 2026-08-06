describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('displays the login form', () => {
    cy.contains('Sign In').should('be.visible');
    cy.get('input[placeholder="e.g. 9876543210"]').should('be.visible');
    cy.get('input[placeholder="Enter your password"]').should('be.visible');
    cy.contains('button', 'Sign In to Terminal').should('be.visible');
    cy.contains('button', 'Register New Account').should('be.visible');
  });

  it('shows validation error for invalid mobile number', () => {
    cy.get('input[placeholder="e.g. 9876543210"]').type('123');
    cy.get('input[placeholder="Enter your password"]').type('password123');
    cy.contains('button', 'Sign In to Terminal').click();
    cy.contains('Mobile number must be exactly 10 digits.').should('be.visible');
  });

  it('logs in successfully with mocked API', () => {
    cy.mockLoginApi();
    cy.mockDashboardApis();

    cy.fixture('users').then(({ TEST_USER }) => {
      cy.get('input[placeholder="e.g. 9876543210"]').type(TEST_USER.mobileNo);
      cy.get('input[placeholder="Enter your password"]').type(TEST_USER.password);
    });

    cy.contains('button', 'Sign In to Terminal').click();
    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });

  it('shows error on failed login', () => {
    cy.mockLoginApi({ succeed: false });

    cy.fixture('users').then(({ TEST_USER }) => {
      cy.get('input[placeholder="e.g. 9876543210"]').type(TEST_USER.mobileNo);
      cy.get('input[placeholder="Enter your password"]').type('wrong-password');
    });

    cy.contains('button', 'Sign In to Terminal').click();
    cy.wait('@loginRequest');
    cy.url().should('include', '/login');
  });

  it('navigates to register page', () => {
    cy.contains('button', 'Register New Account').click();
    cy.url().should('include', '/register');
  });

  it('navigates to forgot password page', () => {
    cy.contains('button', 'Forgot?').click();
    cy.url().should('include', '/forgot-password');
  });
});
