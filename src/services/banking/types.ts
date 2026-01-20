/**
 * Banking service types and interfaces
 */

import type { BankProvider, TransactionType } from '@/types/finance';

export interface BankAccount {
  id: string;
  bankId: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  currency: string;
  balance: number;
  creditLimit?: number;
  iban?: string;
  maskedPan?: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  mccCode?: string;
  date: string;
  time?: string;
  balance?: number;
  category?: string;
  type: TransactionType;
  originalData?: Record<string, unknown>;
}

export interface BankConnectionConfig {
  provider: BankProvider;
  accessToken?: string;
  refreshToken?: string;
  institutionId?: string;
  institutionName?: string;
  expiresAt?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface SyncResult {
  success: boolean;
  accountsSynced: number;
  transactionsSynced: number;
  newTransactions: number;
  errors: string[];
  lastSyncAt: string;
}

export interface Institution {
  id: string;
  name: string;
  logo?: string;
  country: string;
  provider: BankProvider;
}

/**
 * Base interface for all bank providers
 */
export interface IBankProvider {
  readonly provider: BankProvider;
  readonly name: string;
  readonly supportedCountries: string[];

  /**
   * Check if provider is available (has required credentials)
   */
  isAvailable(): boolean;

  /**
   * Initialize connection (OAuth flow or token validation)
   */
  connect(config: BankConnectionConfig): Promise<BankConnectionConfig>;

  /**
   * Disconnect and revoke access
   */
  disconnect(config: BankConnectionConfig): Promise<void>;

  /**
   * Check if connection is still valid
   */
  validateConnection(config: BankConnectionConfig): Promise<boolean>;

  /**
   * Refresh expired tokens
   */
  refreshToken?(config: BankConnectionConfig): Promise<BankConnectionConfig>;

  /**
   * Get list of available institutions (for multi-bank providers)
   */
  getInstitutions?(): Promise<Institution[]>;

  /**
   * Get all accounts for the connection
   */
  getAccounts(config: BankConnectionConfig): Promise<BankAccount[]>;

  /**
   * Get transactions for an account
   * @param from - Start date (ISO string)
   * @param to - End date (ISO string)
   */
  getTransactions(
    config: BankConnectionConfig,
    accountId: string,
    from?: string,
    to?: string
  ): Promise<BankTransaction[]>;

  /**
   * Set up webhook for real-time updates (if supported)
   */
  setupWebhook?(config: BankConnectionConfig, webhookUrl: string): Promise<void>;
}

/**
 * Error types for banking operations
 */
export class BankingError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: BankProvider,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'BankingError';
  }
}

export class AuthenticationError extends BankingError {
  constructor(message: string, provider: BankProvider) {
    super(message, 'AUTH_ERROR', provider, false);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends BankingError {
  constructor(message: string, provider: BankProvider, public retryAfter?: number) {
    super(message, 'RATE_LIMIT', provider, true);
    this.name = 'RateLimitError';
  }
}

export class ConnectionError extends BankingError {
  constructor(message: string, provider: BankProvider) {
    super(message, 'CONNECTION_ERROR', provider, true);
    this.name = 'ConnectionError';
  }
}
