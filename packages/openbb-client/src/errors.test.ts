import { describe, it, expect } from 'vitest';
import { OpenBBError } from './errors';

describe('OpenBBError', () => {
  it('should create error with message', () => {
    const error = new OpenBBError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('OpenBBError');
  });

  it('should create error with options', () => {
    const error = new OpenBBError('Test error', {
      status: 404,
      provider: 'test-provider',
      endpoint: '/test',
    });
    expect(error.status).toBe(404);
    expect(error.provider).toBe('test-provider');
    expect(error.endpoint).toBe('/test');
  });

  it('should create error from response', () => {
    const response = new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    const error = OpenBBError.fromResponse(response, '/test');
    expect(error.message).toContain('Internal Server Error');
    expect(error.status).toBe(500);
    expect(error.endpoint).toBe('/test');
  });

  it('should create network error', () => {
    const error = OpenBBError.networkError('/test', new Error('Network failure'));
    expect(error.message).toContain('Network error');
    expect(error.endpoint).toBe('/test');
  });

  it('should create validation error', () => {
    const error = OpenBBError.validationError('/test', { field: 'invalid' });
    expect(error.message).toContain('validation failed');
    expect(error.endpoint).toBe('/test');
  });

  it('should create provider error', () => {
    const error = OpenBBError.providerError('test-provider', 'Provider failed');
    expect(error.message).toContain('test-provider');
    expect(error.message).toContain('Provider failed');
    expect(error.provider).toBe('test-provider');
  });
});
