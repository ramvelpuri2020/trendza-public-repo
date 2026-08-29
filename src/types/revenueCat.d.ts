import { CustomerInfo as BaseCustomerInfo } from '@revenuecat/purchases-capacitor';

export interface CustomerInfo extends BaseCustomerInfo {
  latestExpirationDate?: string;
  allExpirationDates?: Record<string, string>;
}

declare module '@revenuecat/purchases-capacitor' {
  export interface CustomerInfo {
    entitlements: {
      active: {
        [key: string]: {
          isActive: boolean;
          willRenew: boolean;
          periodType: string;
          latestPurchaseDate: string;
          originalPurchaseDate: string;
          expirationDate: string | null;
          store: string;
          productIdentifier: string;
          productPlanIdentifier: string | null;
          unsubscribeDetectedAt: string | null;
          billingIssueDetectedAt: string | null;
          gracePeriodExpirationDate: string | null;
        };
      };
    };
    activeSubscriptions: string[];
    allExpirationDates: { [key: string]: number };
    allPurchasedProductIdentifiers: string[];
    originalPurchaseDate: string | null;
    requestDate: string;
    firstSeen: string;
    originalAppUserId: string;
    allPurchaseDates: { [key: string]: string };
    managementURL: string | null;
    latestExpirationDate?: string;
    allExpirationDates?: Record<string, string>;
  }

  export interface PurchasesPackage {
    identifier: string;
    offeringIdentifier: string;
    product: {
      identifier: string;
      title: string;
      description: string;
      price: number;
      priceString: string;
      currencyCode: string;
      subscriptionPeriod: string;
    };
  }

  export interface PurchasesOffering {
    identifier: string;
    serverDescription: string;
    availablePackages: PurchasesPackage[];
  }

  export interface Offerings {
    current: PurchasesOffering | null;
    all: { [key: string]: PurchasesOffering };
  }

  export enum LOG_LEVEL {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
  }

  export interface PurchaseStoreProductOptions {
    productIdentifier: string;
  }

  export class Purchases {
    static setLogLevel({ level }: { level: LOG_LEVEL }): Promise<void>;
    static configure({ apiKey, appUserID }: { apiKey: string; appUserID: string | null }): Promise<void>;
    static getOfferings(): Promise<Offerings>;
    static purchasePackage({ offeringIdentifier, packageIdentifier }: { offeringIdentifier: string; packageIdentifier: string }): Promise<{ customerInfo: CustomerInfo }>;
    static purchaseStoreProduct(product: PurchasesPackage['product']): Promise<{ customerInfo: CustomerInfo }>;
    static restorePurchases(): Promise<{ customerInfo: CustomerInfo }>;
    static getCustomerInfo(): Promise<{ customerInfo: CustomerInfo }>;
    static logIn({ appUserID }: { appUserID: string }): Promise<void>;
    static logOut(): Promise<void>;
    static addCustomerInfoUpdateListener(callback: (info: { customerInfo: CustomerInfo }) => void): Promise<void>;
  }
}
