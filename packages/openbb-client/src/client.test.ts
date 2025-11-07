import { describe, it, expect } from 'vitest';
import { OpenBBClient } from './client';

describe('OpenBBClient', () => {
  it('should create client with default config', () => {
    const client = new OpenBBClient();
    expect(client).toBeDefined();
  });

  it('should create client with custom config', () => {
    const client = new OpenBBClient({
      baseUrl: 'http://localhost:8000',
      timeout: 10000,
    });
    expect(client).toBeDefined();
  });

  it('should have equity endpoints', () => {
    const client = new OpenBBClient();
    expect(client.equity).toBeDefined();
    expect(client.equity.price).toBeDefined();
    expect(client.equity.profile).toBeDefined();
    expect(client.equity.fundamental).toBeDefined();
  });

  it('should have options endpoints', () => {
    const client = new OpenBBClient();
    expect(client.options).toBeDefined();
  });

  it('should have economy endpoints', () => {
    const client = new OpenBBClient();
    expect(client.economy).toBeDefined();
  });

  it('should have news endpoints', () => {
    const client = new OpenBBClient();
    expect(client.news).toBeDefined();
  });
});
