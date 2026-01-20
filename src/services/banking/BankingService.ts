/**
 * Unified Banking Service
 * Orchestrates all bank providers and handles transaction sync
 */

import type { BankProvider } from '@/types/finance';
import type {
  IBankProvider,
  BankAccount,
  BankTransaction,
  BankConnectionConfig,
  Institution,
  SyncResult,
} from './types';
import { BankingError } from './types';
import { monobankProvider } from './MonobankProvider';
import { nordigenProvider } from './NordigenProvider';
import { plaidProvider } from './PlaidProvider';
import { autoCategorize } from './mccMapping';

class BankingService {
  private providers: Map<BankProvider, IBankProvider> = new Map([
    ['monobank', monobankProvider],
    ['nordigen', nordigenProvider],
    ['plaid', plaidProvider],
  ]);

  /**
   * Get available providers based on environment configuration
   */
  getAvailableProviders(): IBankProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable());
  }

  /**
   * Get provider by name
   */
  getProvider(name: BankProvider): IBankProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get providers available for a specific country
   */
  getProvidersForCountry(countryCode: string): IBankProvider[] {
    return this.getAvailableProviders().filter((p) =>
      p.supportedCountries.includes(countryCode.toUpperCase())
    );
  }

  /**
   * Get all institutions for a country (from all providers)
   */
  async getInstitutionsForCountry(countryCode: string): Promise<Institution[]> {
    const providers = this.getProvidersForCountry(countryCode);
    const institutions: Institution[] = [];

    for (const provider of providers) {
      if (provider.getInstitutions) {
        try {
          const providerInstitutions = await provider.getInstitutions();
          institutions.push(
            ...providerInstitutions.filter(
              (i) => i.country === countryCode.toUpperCase()
            )
          );
        } catch (error) {
          console.error(`Failed to get institutions from ${provider.name}:`, error);
        }
      }
    }

    return institutions;
  }

  /**
   * Connect to a bank
   */
  async connect(
    providerName: BankProvider,
    config: BankConnectionConfig
  ): Promise<BankConnectionConfig> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new BankingError(`Unknown provider: ${providerName}`, 'UNKNOWN_PROVIDER', providerName);
    }

    if (!provider.isAvailable()) {
      throw new BankingError(
        `Provider ${providerName} is not configured`,
        'PROVIDER_NOT_AVAILABLE',
        providerName
      );
    }

    return provider.connect(config);
  }

  /**
   * Disconnect from a bank
   */
  async disconnect(
    providerName: BankProvider,
    config: BankConnectionConfig
  ): Promise<void> {
    const provider = this.providers.get(providerName);
    if (!provider) return;

    await provider.disconnect(config);
  }

  /**
   * Validate a bank connection
   */
  async validateConnection(
    providerName: BankProvider,
    config: BankConnectionConfig
  ): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) return false;

    return provider.validateConnection(config);
  }

  /**
   * Get accounts from a bank connection
   */
  async getAccounts(
    providerName: BankProvider,
    config: BankConnectionConfig
  ): Promise<BankAccount[]> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new BankingError(`Unknown provider: ${providerName}`, 'UNKNOWN_PROVIDER', providerName);
    }

    return provider.getAccounts(config);
  }

  /**
   * Get transactions from a bank account
   */
  async getTransactions(
    providerName: BankProvider,
    config: BankConnectionConfig,
    accountId: string,
    from?: string,
    to?: string
  ): Promise<BankTransaction[]> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new BankingError(`Unknown provider: ${providerName}`, 'UNKNOWN_PROVIDER', providerName);
    }

    const transactions = await provider.getTransactions(config, accountId, from, to);

    // Ensure all transactions have categories
    return transactions.map((tx) => {
      if (!tx.category) {
        const categorization = autoCategorize(tx.mccCode, tx.description, tx.type === 'income' ? tx.amount : -tx.amount);
        return { ...tx, category: categorization.category };
      }
      return tx;
    });
  }

  /**
   * Sync all accounts for a connection
   */
  async syncConnection(
    providerName: BankProvider,
    config: BankConnectionConfig,
    existingTransactionIds: Set<string>,
    onTransaction?: (tx: BankTransaction) => Promise<void>
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      accountsSynced: 0,
      transactionsSynced: 0,
      newTransactions: 0,
      errors: [],
      lastSyncAt: new Date().toISOString(),
    };

    try {
      // Validate connection first
      const isValid = await this.validateConnection(providerName, config);
      if (!isValid) {
        result.errors.push('Connection is no longer valid');
        return result;
      }

      // Get accounts
      const accounts = await this.getAccounts(providerName, config);
      result.accountsSynced = accounts.length;

      // Get transactions for each account (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      for (const account of accounts) {
        try {
          const transactions = await this.getTransactions(
            providerName,
            config,
            account.id,
            thirtyDaysAgo
          );

          for (const tx of transactions) {
            result.transactionsSynced++;

            // Check if transaction already exists
            if (!existingTransactionIds.has(tx.id)) {
              result.newTransactions++;

              if (onTransaction) {
                await onTransaction(tx);
              }
            }
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync account ${account.name}: ${(error as Error).message}`
          );
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Sync failed: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(
    providerName: BankProvider,
    config: BankConnectionConfig
  ): Promise<BankConnectionConfig> {
    const provider = this.providers.get(providerName);
    if (!provider || !provider.refreshToken) return config;

    // Check if token is still valid
    const isValid = await this.validateConnection(providerName, config);
    if (isValid) return config;

    // Try to refresh
    return provider.refreshToken(config);
  }
}

// Singleton instance
export const bankingService = new BankingService();
