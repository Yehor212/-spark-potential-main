/**
 * Plaid Bank API Provider
 * Paid service supporting US, UK, EU, Canada
 * Docs: https://plaid.com/docs/
 *
 * Note: Plaid requires server-side integration for security.
 * This provider works with a backend proxy endpoint.
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

// Plaid API calls should go through backend proxy for security
const PLAID_PROXY_API = import.meta.env.VITE_PLAID_PROXY_URL || '/api/plaid';

interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number;
    limit: number | null;
    iso_currency_code: string;
  };
  mask: string;
  name: string;
  official_name: string | null;
  subtype: string;
  type: string;
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string;
  date: string;
  datetime?: string;
  name: string;
  merchant_name?: string;
  category?: string[];
  category_id?: string;
  personal_finance_category?: {
    primary: string;
    detailed: string;
  };
  payment_channel: string;
  pending: boolean;
  location?: {
    address?: string;
    city?: string;
    country?: string;
  };
}

interface PlaidInstitution {
  institution_id: string;
  name: string;
  logo?: string;
  primary_color?: string;
  country_codes: string[];
  products: string[];
}

interface PlaidLinkToken {
  link_token: string;
  expiration: string;
}

interface PlaidExchangeResponse {
  access_token: string;
  item_id: string;
}

// Countries where Plaid is available
const PLAID_COUNTRIES = ['US', 'CA', 'GB', 'IE', 'FR', 'ES', 'NL', 'DE'];

export class PlaidProvider implements IBankProvider {
  readonly provider = 'plaid' as const;
  readonly name = 'Plaid';
  readonly supportedCountries = PLAID_COUNTRIES;

  isAvailable(): boolean {
    // Plaid needs backend configuration
    return !!import.meta.env.VITE_PLAID_PROXY_URL;
  }

  async connect(config: BankConnectionConfig): Promise<BankConnectionConfig> {
    // For Plaid, connection happens via Plaid Link (frontend SDK)
    // This method is called after Plaid Link returns a public_token

    if (!config.accessToken) {
      // No public_token yet - need to create Link token
      const linkToken = await this.createLinkToken();

      return {
        ...config,
        provider: 'plaid',
        // Frontend should use this to open Plaid Link
        refreshToken: linkToken.link_token,
      };
    }

    // Exchange public_token for access_token
    const exchangeResult = await this.exchangePublicToken(config.accessToken);

    return {
      ...config,
      provider: 'plaid',
      accessToken: exchangeResult.access_token,
      institutionId: exchangeResult.item_id,
    };
  }

  async disconnect(config: BankConnectionConfig): Promise<void> {
    if (!config.accessToken) return;

    try {
      await this.makeRequest('/item/remove', {
        access_token: config.accessToken,
      });
    } catch {
      // Ignore errors during disconnect
    }
  }

  async validateConnection(config: BankConnectionConfig): Promise<boolean> {
    if (!config.accessToken) return false;

    try {
      await this.makeRequest('/accounts/get', {
        access_token: config.accessToken,
      });
      return true;
    } catch {
      return false;
    }
  }

  async refreshToken(config: BankConnectionConfig): Promise<BankConnectionConfig> {
    // Plaid access tokens don't expire, but items can become stale
    // User needs to re-authenticate via Plaid Link in update mode

    if (!config.accessToken) {
      throw new AuthenticationError('Access token required', 'plaid');
    }

    // Create update mode link token
    const linkToken = await this.createLinkToken(config.accessToken);

    return {
      ...config,
      refreshToken: linkToken.link_token,
    };
  }

  async getInstitutions(country?: string): Promise<Institution[]> {
    const response = await this.makeRequest<{ institutions: PlaidInstitution[] }>(
      '/institutions/get',
      {
        country_codes: country ? [country] : PLAID_COUNTRIES,
        count: 100,
        offset: 0,
        options: {
          include_optional_metadata: true,
        },
      }
    );

    return response.institutions.map((inst) => ({
      id: inst.institution_id,
      name: inst.name,
      logo: inst.logo ? `data:image/png;base64,${inst.logo}` : undefined,
      country: inst.country_codes[0] || 'US',
      provider: 'plaid',
    }));
  }

  async getAccounts(config: BankConnectionConfig): Promise<BankAccount[]> {
    if (!config.accessToken) {
      throw new AuthenticationError('Access token is required', 'plaid');
    }

    const response = await this.makeRequest<{ accounts: PlaidAccount[] }>('/accounts/get', {
      access_token: config.accessToken,
    });

    return response.accounts.map((acc) => ({
      id: acc.account_id,
      bankId: acc.account_id,
      name: acc.official_name || acc.name,
      type: this.mapAccountType(acc.type, acc.subtype),
      currency: acc.balances.iso_currency_code || 'USD',
      balance: acc.balances.available ?? acc.balances.current,
      creditLimit: acc.balances.limit ?? undefined,
      maskedPan: acc.mask,
    }));
  }

  async getTransactions(
    config: BankConnectionConfig,
    accountId: string,
    from?: string,
    to?: string
  ): Promise<BankTransaction[]> {
    if (!config.accessToken) {
      throw new AuthenticationError('Access token is required', 'plaid');
    }

    const startDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = to || new Date().toISOString().split('T')[0];

    const allTransactions: PlaidTransaction[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    // Use sync endpoint for efficiency
    while (hasMore) {
      const response = await this.makeRequest<{
        added: PlaidTransaction[];
        modified: PlaidTransaction[];
        removed: { transaction_id: string }[];
        has_more: boolean;
        next_cursor: string;
      }>('/transactions/sync', {
        access_token: config.accessToken,
        cursor,
        count: 500,
      });

      allTransactions.push(...response.added, ...response.modified);
      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    // Filter by account and date
    return allTransactions
      .filter((tx) => {
        if (tx.account_id !== accountId) return false;
        if (tx.date < startDate || tx.date > endDate) return false;
        return true;
      })
      .map((tx) => this.mapTransaction(tx));
  }

  /**
   * Get Plaid Link token for frontend SDK
   */
  async getLinkToken(accessToken?: string): Promise<string> {
    const response = await this.createLinkToken(accessToken);
    return response.link_token;
  }

  /**
   * Handle public_token from Plaid Link
   */
  async handlePublicToken(publicToken: string): Promise<BankConnectionConfig> {
    const result = await this.exchangePublicToken(publicToken);

    return {
      provider: 'plaid',
      accessToken: result.access_token,
      institutionId: result.item_id,
    };
  }

  private async createLinkToken(accessToken?: string): Promise<PlaidLinkToken> {
    const payload: Record<string, unknown> = {
      user: {
        client_user_id: crypto.randomUUID(),
      },
      client_name: 'KopiMaster',
      products: ['transactions'],
      country_codes: PLAID_COUNTRIES,
      language: 'en',
    };

    // Update mode if access_token provided
    if (accessToken) {
      payload.access_token = accessToken;
    }

    return this.makeRequest('/link/token/create', payload);
  }

  private async exchangePublicToken(publicToken: string): Promise<PlaidExchangeResponse> {
    return this.makeRequest('/item/public_token/exchange', {
      public_token: publicToken,
    });
  }

  private mapTransaction(tx: PlaidTransaction): BankTransaction {
    // Plaid amounts are positive for expenses, negative for income
    const isExpense = tx.amount > 0;

    // Use Plaid's category if available
    let category = 'other';
    if (tx.personal_finance_category) {
      category = this.mapPlaidCategory(tx.personal_finance_category.primary);
    } else {
      const categorization = autoCategorize(undefined, tx.name, isExpense ? -tx.amount : tx.amount);
      category = categorization.category;
    }

    return {
      id: tx.transaction_id,
      accountId: tx.account_id,
      amount: Math.abs(tx.amount),
      currency: tx.iso_currency_code || 'USD',
      description: tx.merchant_name || tx.name,
      date: tx.date,
      time: tx.datetime?.split('T')[1]?.split('.')[0],
      category,
      type: isExpense ? 'expense' : 'income',
      originalData: tx as unknown as Record<string, unknown>,
    };
  }

  private mapAccountType(
    type: string,
    subtype: string
  ): 'checking' | 'savings' | 'credit' | 'investment' {
    if (type === 'credit') return 'credit';
    if (type === 'investment' || type === 'brokerage') return 'investment';
    if (subtype === 'savings' || subtype === 'money market') return 'savings';
    return 'checking';
  }

  private mapPlaidCategory(plaidCategory: string): string {
    const categoryMap: Record<string, string> = {
      FOOD_AND_DRINK: 'food',
      TRANSPORTATION: 'transport',
      ENTERTAINMENT: 'entertainment',
      SHOPPING: 'shopping',
      MEDICAL: 'health',
      UTILITIES: 'utilities',
      EDUCATION: 'education',
      INCOME: 'salary',
      TRANSFER_IN: 'other',
      TRANSFER_OUT: 'other',
    };

    return categoryMap[plaidCategory] || 'other';
  }

  private async makeRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    try {
      const response = await fetch(`${PLAID_PROXY_API}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        throw new RateLimitError('Rate limit exceeded', 'plaid', 60000);
      }

      if (response.status === 401 || response.status === 400) {
        const error = await response.json();
        throw new AuthenticationError(
          error.error_message || 'Authentication failed',
          'plaid'
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConnectionError(`Plaid API error: ${errorText}`, 'plaid');
      }

      return response.json();
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof RateLimitError ||
        error instanceof ConnectionError
      ) {
        throw error;
      }
      throw new ConnectionError(`Network error: ${(error as Error).message}`, 'plaid');
    }
  }
}

// Singleton instance
export const plaidProvider = new PlaidProvider();
