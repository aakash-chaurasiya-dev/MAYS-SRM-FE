const MANAGER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6W3siYXV0aG9yaXR5IjoiUk9MRV9NQU5BR0VSIn1dLCJ1c2VySWQiOjEsInN1YiI6ImN5cHJlc3MtdXNlciIsImV4cCI6NDEwMjQ0NDgwMH0.cypress-mock';

Cypress.Commands.add('mockLoginApi', (options = {}) => {
  const { succeed = true, token = MANAGER_TOKEN } = options;

  if (succeed) {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token },
    }).as('loginRequest');
  } else {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginRequest');
  }
});

Cypress.Commands.add('mockDashboardApis', () => {
  cy.intercept('GET', '**/api/tickets/dashboard/stats', {
    statusCode: 200,
    body: {
      totalTickets: 5,
      openTickets: 2,
      inProgressTickets: 1,
      resolvedTickets: 2,
    },
  }).as('dashboardStats');

  cy.intercept('GET', '**/api/tickets/admin/dashboard*', {
    statusCode: 200,
    body: { data: [], total: 0 },
  }).as('adminTickets');

  cy.intercept('GET', '**/api/tickets/user/dashboard/**', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/api/tickets/employee/**', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/api/tickets/vendor/**', {
    statusCode: 200,
    body: [],
  });
});

Cypress.Commands.add('mockMaintenanceApis', () => {
  cy.fixture('ticket-types').then((ticketTypes) => {
    cy.intercept('GET', '**/api/ticket-types', {
      statusCode: 200,
      body: ticketTypes,
    }).as('ticketTypes');
  });

  cy.fixture('warranty-types').then((warrantyTypes) => {
    cy.intercept('GET', '**/api/warranty-types', {
      statusCode: 200,
      body: warrantyTypes,
    }).as('warrantyTypes');
  });
});

Cypress.Commands.add('loginByApi', (mobileNo = '9876543210', password = 'password123') => {
  cy.mockLoginApi();
  cy.mockDashboardApis();
  cy.visit('/login');
  cy.get('input[placeholder="e.g. 9876543210"]').type(mobileNo);
  cy.get('input[placeholder="Enter your password"]').type(password);
  cy.contains('button', 'Sign In to Terminal').click();
  cy.wait('@loginRequest');
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('loginBySession', () => {
  cy.mockDashboardApis();
  cy.window().then((win) => {
    win.localStorage.setItem('token', MANAGER_TOKEN);
  });
});
