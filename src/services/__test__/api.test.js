import api from '../../test-utils/mockApi';

describe('api service', () => {
  it('creates an axios-like instance with a base URL', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('exposes HTTP verb helpers', () => {
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
  });
});
