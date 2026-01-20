/**
 * Monobank API Provider
 * Free API for Ukrainian users
 * Docs: https://api.monobank.ua/docs/
 */

import type {
  IBankProvider,
  BankAccount,
  BankTransaction,
  BankConnectionConfig,
  Institution,
} from './types';
import { AuthenticationError, RateLimitError, ConnectionError } from './types';
import { autoCategorize } from './mccMapping';

const MONOBANK_API = 'https://api.monobank.ua';

interface MonobankAccount {
  id: string;
  sendId: string;
  currencyCode: number;
  cashbackType: string;
  balance: number;
  creditLimit: number;
  maskedPan: string[];
  type: 'black' | 'white' | 'platinum' | 'iron' | 'fop' | 'yellow';
  iban: string;
}

interface MonobankTransaction {
  id: string;
  time: number;
  description: string;
  mcc: number;
  originalMcc: number;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  hold: boolean;
  receiptId?: string;
}

interface MonobankClientInfo {
  clientId: string;
  name: string;
  webHookUrl?: string;
  permissions: string;
  accounts: MonobankAccount[];
}

// ISO 4217 currency codes
const CURRENCY_MAP: Record<number, string> = {
  980: 'UAH',
  840: 'USD',
  978: 'EUR',
  826: 'GBP',
  985: 'PLN',
};

function getCurrencyCode(isoCode: number): string {
  return CURRENCY_MAP[isoCode] || 'UAH';
}

function mapAccountType(type: string): 'checking' | 'savings' | 'credit' {
  switch (type) {
    case 'fop':
      return 'checking'; // FOP business account
    case 'yellow':
      return 'savings'; // Yellow card (children)
    default:
      return 'checking';
  }
}

export class MonobankProvider implements IBankProvider {
  readonly provider = 'monobank' as const;
  readonly name = 'Monobank';
  readonly supportedCountries = ['UA'];

  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 60000; // 1 minute between requests (Monobank limit)

  isAvailable(): boolean {
    // Monobank just needs a token, always "available"
    return true;
  }

  async connect(config: BankConnectionConfig): Promise<BankConnectionConfig> {
    if (!config.accessToken) {
      throw new AuthenticationError('Monobank token is required', 'monobank');
    }

    // Validate token by getting client info
    const isValid = await this.validateConnection(config);
    if (!isValid) {
      throw new AuthenticationError('Invalid Monobank token', 'monobank');
    }

    return {
      ...config,
      provider: 'monobank',
      institutionName: 'Monobank',
    };
  }

  async disconnect(): Promise<void> {
    // Monobank tokens don't have a revoke endpoint
    // User should regenerate token in Monobank app
  }

  async validateConnection(config: BankConnectionConfig): Promise<boolean> {
    if (!config.accessToken) return false;

    try {
      await this.makeRequest<MonobankClientInfo>('/personal/client-info', config.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  async getInstitutions(): Promise<Institution[]> {
    // Monobank is single institution
    return [
      {
        id: 'monobank',
        name: 'Monobank',
        logo: 'https://api.monobank.ua/logo.png',
        country: 'UA',
        provider: 'monobank',
      },
    ];
  }

  async getAccounts(config: BankConnectionConfig): Promise<BankAccount[]> {
    if (!config.accessToken) {
      throw new AuthenticationError('Monobank token is required', 'monobank');
    }

    const clientInfo = await this.makeRequest<MonobankClientInfo>(
      '/personal/client-info',
      config.accessToken
    );

    return clientInfo.accounts.map((acc) => ({
      id: acc.id,
      bankId: acc.id,
      name: this.getAccountName(acc),
      type: mapAccountType(acc.type),
      currency: getCurrencyCode(acc.currencyCode),
      balance: acc.balance / 100, // Monobank uses kopecks
      creditLimit: acc.creditLimit / 100,
      iban: acc.iban,
      maskedPan: acc.maskedPan?.[0],
    }));
  }

  async getTransactions(
    config: BankConnectionConfig,
    accountId: string,
    from?: string,
    to?: string
  ): Promise<BankTransaction[]> {
    if (!config.accessToken) {
      throw new AuthenticationError('Monobank token is required', 'monobank');
    }

    // Monobank uses Unix timestamps in seconds
    const fromTimestamp = from
      ? Math.floor(new Date(from).getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // 30 days ago

    const toTimestamp = to
      ? Math.floor(new Date(to).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    const transactions = await this.makeRequest<MonobankTransaction[]>(
      `/personal/statement/${accountId}/${fromTimestamp}/${toTimestamp}`,
      config.accessToken
    );

    return transactions.map((tx) => this.mapTransaction(tx, accountId));
  }

  async setupWebhook(config: BankConnectionConfig, webhookUrl: string): Promise<void> {
    if (!config.accessToken) {
      throw new AuthenticationError('Monobank token is required', 'monobank');
    }

    await this.makeRequest('/personal/webhook', config.accessToken, {
      method: 'POST',
      body: JSON.stringify({ webHookUrl: webhookUrl }),
    });
  }

  private mapTransaction(tx: MonobankTransaction, accountId: string): BankTransaction {
    const isExpense = tx.amount < 0;
    const categorization = autoCategorize(tx.mcc, tx.description, tx.amount);

    return {
      id: tx.id,
      accountId,
      amount: Math.abs(tx.amount) / 100, // Convert from kopecks, always positive
      currency: 'UAH', // Monobank amounts are always in account currency
      description: tx.description,
      mccCode: String(tx.mcc),
      date: new Date(tx.time * 1000).toISOString().split('T')[0],
      time: new Date(tx.time * 1000).toISOString().split('T')[1].split('.')[0],
      balance: tx.balance / 100,
      category: categorization.category,
      type: isExpense ? 'expense' : 'income',
      originalData: tx as unknown as Record<string, unknown>,
    };
  }

  private getAccountName(account: MonobankAccount): string {
    const cardType =
      {
        black: 'Black',
        white: 'White',
        platinum: 'Platinum',
        iron: 'Iron',
        fop: 'ФОП',
        yellow: 'Yellow',
      }[account.type] || 'Card';

    const currency = getCurrencyCode(account.currencyCode);
    const maskedPan = account.maskedPan?.[0]?.slice(-4) || '';

    return `Mono ${cardType} ${currency}${maskedPan ? ` *${maskedPan}` : ''}`;
  }

  private async makeRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Rate limiting - Monobank allows 1 request per minute for statement
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (endpoint.includes('/statement/') && timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      throw new RateLimitError(
        'Rate limit: wait before next request',
        'monobank',
        this.MIN_REQUEST_INTERVAL - timeSinceLastRequest
      );
    }

    this.lastRequestTime = now;

    try {
      const response = await fetch(`${MONOBANK_API}${endpoint}`, {
        ...options,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 429) {
        throw new RateLimitError('Too many requests', 'monobank', 60000);
      }

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError('Invalid or expired token', 'monobank');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConnectionError(`Monobank API error: ${errorText}`, 'monobank');
      }

      return response.json();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof RateLimitError) {
        throw error;
      }
      throw new ConnectionError(`Network error: ${(error as Error).message}`, 'monobank');
    }
  }
}

// Singleton instance
export const monobankProvider = new MonobankProvider();
