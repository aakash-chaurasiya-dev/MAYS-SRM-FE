const api = {
  defaults: {
    baseURL: 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' },
  },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn(() => Promise.resolve({ data: { data: [] } })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
};

export default api;
