/**
 * OpenBB Platform WebSocket Client for real-time data
 */

import { OpenBBError } from './errors';

type SubscriptionCallback = (data: unknown) => void;

interface Subscription {
  endpoint: string;
  params: Record<string, unknown>;
  callback: SubscriptionCallback;
}

/**
 * WebSocket client for OpenBB Platform streaming data
 */
export class OpenBBWebSocketClient {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private baseUrl: string;

  constructor(config: { baseUrl: string }) {
    this.baseUrl = config.baseUrl;
  }

  /**
   * Connect to WebSocket server
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.baseUrl);

        this.ws.onopen = () => {
          console.log('OpenBB WebSocket connected');
          this.reconnectAttempts = 0;

          // Resubscribe to existing subscriptions
          this.subscriptions.forEach((sub) => {
            this.sendSubscribe(sub.endpoint, sub.params);
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('OpenBB WebSocket error:', error);
          reject(new OpenBBError('WebSocket connection error'));
        };

        this.ws.onclose = () => {
          console.log('OpenBB WebSocket closed');
          this.handleDisconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket disconnect with reconnection logic
   */
  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: {
    type: string;
    endpoint: string;
    data: unknown;
  }): void {
    if (message.type === 'data') {
      const key = this.getSubscriptionKey(message.endpoint, {});
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        subscription.callback(message.data);
      }
    }
  }

  /**
   * Send subscribe message
   */
  private sendSubscribe(endpoint: string, params: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new OpenBBError('WebSocket not connected');
    }

    this.ws.send(
      JSON.stringify({
        type: 'subscribe',
        endpoint,
        params,
      })
    );
  }

  /**
   * Send unsubscribe message
   */
  private sendUnsubscribe(endpoint: string, params: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return; // Silently ignore if not connected
    }

    this.ws.send(
      JSON.stringify({
        type: 'unsubscribe',
        endpoint,
        params,
      })
    );
  }

  /**
   * Generate subscription key
   */
  private getSubscriptionKey(endpoint: string, params: Record<string, unknown>): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Subscribe to real-time data
   */
  async subscribe(
    endpoint: string,
    params: Record<string, unknown>,
    callback: SubscriptionCallback
  ): Promise<void> {
    // Connect if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    const key = this.getSubscriptionKey(endpoint, params);
    this.subscriptions.set(key, { endpoint, params, callback });
    this.sendSubscribe(endpoint, params);
  }

  /**
   * Unsubscribe from real-time data
   */
  unsubscribe(endpoint: string, params: Record<string, unknown>): void {
    const key = this.getSubscriptionKey(endpoint, params);
    this.subscriptions.delete(key);
    this.sendUnsubscribe(endpoint, params);
  }

  /**
   * Close WebSocket connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }
}
