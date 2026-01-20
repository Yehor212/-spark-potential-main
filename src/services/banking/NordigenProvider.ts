/**
 * Nordigen (GoCardless) Bank API Provider
 * Free tier available for EU banks via PSD2
 * Docs: https://developer.gocardless.com/bank-account-data/overview
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

const NORDIGEN_API = 'https://bankaccountdata.gocardless.com/api/v2';

interface NordigenToken {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
}

interface NordigenInstitution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

interface NordigenRequisition {
  id: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  link: string;
}

interface NordigenAccount {
  id: string;
  created: string;
  last_accessed: string;
  iban: string;
  institution_id: string;
  status: string;
  owner_name?: string;
}

interface NordigenAccountDetails {
  account: {
    resourceId: string;
    iban: string;
    currency: string;
    name?: string;
    product?: string;
    ownerName?: string;
    cashAccountType?: string;
  };
}

interface NordigenBalance {
  balanceAmount: {
    amount: string;
    currency: string;
  };
  balanceType: string;
  referenceDate?: string;
}

interface NordigenTransaction {
  transactionId: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationStructured?: string;
  bankTransactionCode?: string;
  proprietaryBankTransactionCode?: string;
  internalTransactionId?: string;
  merchantCategoryCode?: string;
}

interface NordigenTransactionsResponse {
  transactions: {
    booked: NordigenTransaction[];
    pending?: NordigenTransaction[];
  };
}

// EU countries supported by Nordigen
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'NO', 'IS',
  'LI', 'CH'
];

export class NordigenProvider implements IBankProvider {
  readonly provider = 'nordigen' as const;
  readonly name = 'Nordigen (GoCardless)';
  readonly supportedCountries = EU_COUNTRIES;

  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  isAvailable(): boolean {
    // Nordigen needs client ID and secret from env
    return !!(
      import.meta.env.VITE_NORDIGEN_SECRET_ID &&
      import.meta.env.VITE_NORDIGEN_SECRET_KEY
    );
  }

  async connect(config: BankConnectionConfig): Promise<BankConnectionConfig> {
    // Get access token
    const token = await this.getAccessToken();

    if (!config.institutionId) {
      throw new AuthenticationError('Institution ID is required for Nordigen', 'nordigen');
    }

    // Create end user agreement (EUA)
    const agreement = await this.createEndUserAgreement(token, config.institutionId);

    // Create requisition (bank connection request)
    const requisition = await this.createRequisition(
      token,
      config.institutionId,
      agreement.id,
      `${window.location.origin}/banking/callback`
    );

    // Return config with redirect URL for OAuth
    return {
      ...config,
      provider: 'nordigen',
      accessToken: requisition.id, // Store requisition ID
      refreshToken: agreement.id,
      // Frontend should redirect user to requisition.link
    };
  }

  async disconnect(config: BankConnectionConfig): Promise<void> {
    if (!config.accessToken) return;

    const token = await this.getAccessToken();

    try {
      await this.makeRequest(`/requisitions/${config.accessToken}/`, token, {
        method: 'DELETE',
      });
    } catch {
      // Ignore errors during disconnect
    }
  }

  async validateConnection(config: BankConnectionConfig): Promise<boolean> {
    if (!config.accessToken) return false;

    try {
      const token = await this.getAccessToken();
      const requisition = await this.makeRequest<NordigenRequisition>(
        `/requisitions/${config.accessToken}/`,
        token
      );

      return requisition.status === 'LN' && requisition.accounts.length > 0;
    } catch {
      return false;
    }
  }

  async refreshToken(config: BankConnectionConfig): Promise<BankConnectionConfig> {
    // Nordigen tokens are managed internally
    // Requisitions don't need refresh unless expired (90 days)
    return config;
  }

  async getInstitutions(country?: string): Promise<Institution[]> {
    const token = await this.getAccessToken();
    const countryParam = country ? `?country=${country}` : '';

    const institutions = await this.makeRequest<NordigenInstitution[]>(
      `/institutions/${countryParam}`,
      token
    );

    return institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      logo: inst.logo,
      country: inst.countries[0] || 'EU',
      provider: 'nordigen',
    }));
  }

  async getAccounts(config: BankConnectionConfig): Promise<BankAccount[]> {
    if (!config.accessToken) {
      throw new AuthenticationError('Requisition ID is required', 'nordigen');
    }

    const token = await this.getAccessToken();

    // Get requisition to get account IDs
    const requisition = await this.makeRequest<NordigenRequisition>(
      `/requisitions/${config.accessToken}/`,
      token
    );

    if (requisition.status !== 'LN') {
      throw new AuthenticationError('Bank connection not linked', 'nordigen');
    }

    // Fetch details for each account
    const accounts: BankAccount[] = [];

    for (const accountId of requisition.accounts) {
      try {
        const [details, balances] = await Promise.all([
          this.makeRequest<NordigenAccountDetails>(`/accounts/${accountId}/details/`, token),
          this.makeRequest<{ balances: NordigenBalance[] }>(`/accounts/${accountId}/balances/`, token),
        ]);

        const balance = balances.balances.find(
          (b) => b.balanceType === 'interimAvailable' || b.balanceType === 'expected'
        ) || balances.balances[0];

        accounts.push({
          id: accountId,
          bankId: accountId,
          name: details.account.name || details.account.ownerName || `Account ${details.account.iban?.slice(-4)}`,
          type: this.mapAccountType(details.account.cashAccountType),
          currency: details.account.currency || balance?.balanceAmount.currency || 'EUR',
          balance: parseFloat(balance?.balanceAmount.amount || '0'),
          iban: details.account.iban,
        });
      } catch (error) {
        console.error(`Failed to fetch account ${accountId}:`, error);
      }
    }

    return accounts;
  }

  async getTransactions(
    config: BankConnectionConfig,
    accountId: string,
    from?: string,
    to?: string
  ): Promise<BankTransaction[]> {
    const token = await this.getAccessToken();

    const params = new URLSearchParams();
    if (from) params.set('date_from', from);
    if (to) params.set('date_to', to);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await this.makeRequest<NordigenTransactionsResponse>(
      `/accounts/${accountId}/transactions/${queryString}`,
      token
    );

    return response.transactions.booked.map((tx) => this.mapTransaction(tx, accountId));
  }

  private mapTransaction(tx: NordigenTransaction, accountId: string): BankTransaction {
    const amount = parseFloat(tx.transactionAmount.amount);
    const isExpense = amount < 0;

    const description =
      tx.remittanceInformationUnstructured ||
      tx.remittanceInformationStructured ||
      tx.creditorName ||
      tx.debtorName ||
      'Transaction';

    const categorization = autoCategorize(tx.merchantCategoryCode, description, amount);

    return {
      id: tx.transactionId || tx.internalTransactionId || crypto.randomUUID(),
      accountId,
      amount: Math.abs(amount),
      currency: tx.transactionAmount.currency,
      description,
      mccCode: tx.merchantCategoryCode,
      date: tx.bookingDate,
      category: categorization.category,
      type: isExpense ? 'expense' : 'income',
      originalData: tx as unknown as Record<string, unknown>,
    };
  }

  private mapAccountType(cashAccountType?: string): 'checking' | 'savings' | 'credit' {
    switch (cashAccountType?.toUpperCase()) {
      case 'CACC': // Current Account
      case 'TRAN': // Transaction Account
        return 'checking';
      case 'SVGS': // Savings Account
        return 'savings';
      case 'CARD': // Card Account
        return 'credit';
      default:
        return 'checking';
    }
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const secretId = import.meta.env.VITE_NORDIGEN_SECRET_ID;
    const secretKey = import.meta.env.VITE_NORDIGEN_SECRET_KEY;

    if (!secretId || !secretKey) {
      throw new AuthenticationError('Nordigen credentials not configured', 'nordigen');
    }

    const response = await fetch(`${NORDIGEN_API}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret_id: secretId,
        secret_key: secretKey,
      }),
    });

    if (!response.ok) {
      throw new AuthenticationError('Failed to get Nordigen access token', 'nordigen');
    }

    const token: NordigenToken = await response.json();
    this.accessToken = token.access;
    this.tokenExpiry = Date.now() + token.access_expires * 1000;

    return token.access;
  }

  private async createEndUserAgreement(
    token: string,
    institutionId: string
  ): Promise<{ id: string }> {
    return this.makeRequest('/agreements/enduser/', token, {
      method: 'POST',
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ['balances', 'details', 'transactions'],
      }),
    });
  }

  private async createRequisition(
    token: string,
    institutionId: string,
    agreementId: string,
    redirectUrl: string
  ): Promise<NordigenRequisition> {
    return this.makeRequest('/requisitions/', token, {
      method: 'POST',
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        agreement: agreementId,
        reference: crypto.randomUUID(),
        user_language: 'EN',
      }),
    });
  }

  private async makeRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${NORDIGEN_API}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        throw new RateLimitError('Rate limit exceeded', 'nordigen', retryAfter * 1000);
      }

      if (response.status === 401 || response.status === 403) {
        this.accessToken = null; // Clear cached token
        throw new AuthenticationError('Authentication failed', 'nordigen');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConnectionError(`Nordigen API error: ${errorText}`, 'nordigen');
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
      throw new ConnectionError(`Network error: ${(error as Error).message}`, 'nordigen');
    }
  }
}

// Singleton instance
export const nordigenProvider = new NordigenProvider();
