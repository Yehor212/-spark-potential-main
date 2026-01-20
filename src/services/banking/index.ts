// Banking service exports
export { bankingService } from './BankingService';
export { monobankProvider } from './MonobankProvider';
export { nordigenProvider } from './NordigenProvider';
export { plaidProvider } from './PlaidProvider';
export { autoCategorize, getCategoryFromMCC, getMCCsForCategory, MCC_RANGES } from './mccMapping';

// Types
export type {
  IBankProvider,
  BankAccount,
  BankTransaction,
  BankConnectionConfig,
  Institution,
  SyncResult,
} from './types';

export {
  BankingError,
  AuthenticationError,
  RateLimitError,
  ConnectionError,
} from './types';
