import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdsContextType {
  adsEnabled: boolean;
  setAdsEnabled: (enabled: boolean) => void;
  showAds: boolean; // Combined check: enabled AND configured
  minTransactionsForAds: number;
}

const ADS_STORAGE_KEY = 'kopimaster_ads_enabled';
const MIN_TRANSACTIONS_FOR_ADS = 5; // Show ads only after user has some engagement

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [adsEnabled, setAdsEnabledState] = useState(() => {
    const stored = localStorage.getItem(ADS_STORAGE_KEY);
    // Default to true (ads enabled) unless user explicitly disabled
    return stored !== 'false';
  });

  // Check if ads are configured via environment
  const isConfigured = Boolean(
    import.meta.env.VITE_ADSENSE_CLIENT_ID ||
    import.meta.env.VITE_ENABLE_SPONSORS === 'true'
  );

  const setAdsEnabled = (enabled: boolean) => {
    setAdsEnabledState(enabled);
    localStorage.setItem(ADS_STORAGE_KEY, String(enabled));
  };

  // Ads should only show if both enabled by user AND configured
  const showAds = adsEnabled && isConfigured;

  return (
    <AdsContext.Provider
      value={{
        adsEnabled,
        setAdsEnabled,
        showAds,
        minTransactionsForAds: MIN_TRANSACTIONS_FOR_ADS,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdsContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
}

// Hook to check if we should show ads based on user engagement
export function useShouldShowAds(transactionCount: number) {
  const { showAds, minTransactionsForAds } = useAds();
  return showAds && transactionCount >= minTransactionsForAds;
}
