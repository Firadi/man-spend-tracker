import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type ProductStatus = 'Draft' | 'Active';

export interface Country {
  id: string;
  name: string;
  currency: string;
  defaultShipping: number;
  defaultCod: number;
  defaultReturn: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  status: ProductStatus;
  cost: number;
  price: number;
  image?: string;
  countryIds: string[];
}

export interface AnalysisOverride {
  revenue?: number;
  ads?: number;
  serviceFees?: number;
  productFees?: number;
  deliveredOrders?: number;
  totalOrders?: number;
  ordersConfirmed?: number;
}

export interface FBAdRow {
  campaignId: string;
  campaignName: string;
  adSetId: string;
  adSetName: string;
  adId: string;
  adName: string;
  status: 'Active' | 'Paused';
}

export interface SelectedAdSet {
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
}

export interface ProductAdsSpend {
  productId: string;
  spend: number;
  source: 'manual' | 'facebook';
  lastUpdated: string;
  linkedAdSets: SelectedAdSet[];
}

// Map: CountryID -> ProductID -> Override
export interface AnalysisState {
  [countryId: string]: {
    [productId: string]: AnalysisOverride;
  };
}

interface AppState {
  countries: Country[];
  products: Product[];
  analysis: AnalysisState;
  
  // Facebook Ads
  fbConnected: boolean;
  setFBConnected: (connected: boolean) => void;
  fbAdsTable: FBAdRow[];
  tempSelectedAdSets: SelectedAdSet[];
  setTempSelectedAdSets: (selected: SelectedAdSet[]) => void;
  
  // Product Ads Spend
  productAdsSpend: Record<string, ProductAdsSpend>;
  updateProductAdsSpend: (productId: string, data: Partial<ProductAdsSpend>) => void;

  addCountry: (country: Omit<Country, 'id'>) => void;
  updateCountry: (id: string, data: Partial<Country>) => void;
  deleteCountry: (id: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  addProducts: (products: Omit<Product, 'id'>[]) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deleteProducts: (ids: string[]) => void;

  updateAnalysis: (countryId: string, productId: string, data: AnalysisOverride) => void;
  
  // Column reordering
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  seed: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      countries: [],
      products: [],
      analysis: {},
      
      fbConnected: false,
      setFBConnected: (connected) => set({ fbConnected: connected }),
      
      fbAdsTable: [],
      tempSelectedAdSets: [],
      setTempSelectedAdSets: (selected) => set({ tempSelectedAdSets: selected }),

      productAdsSpend: {},
      updateProductAdsSpend: (productId, data) => set((state) => {
        const current = state.productAdsSpend[productId] || {
          productId,
          spend: 0,
          source: 'manual',
          lastUpdated: new Date().toISOString(),
          linkedAdSets: []
        };
        return {
          productAdsSpend: {
            ...state.productAdsSpend,
            [productId]: { ...current, ...data }
          }
        };
      }),

      columnOrder: [
        'product', 
        'totalOrders', 
        'ordersConfirmed', 
        'confirmationRate',
        'deliveredOrders', 
        'deliveryRate',
        'deliveryRatePerLead',
        'revenue', 
        'ads', 
        'serviceFees', 
        'productFees', 
        'profit'
      ],
      sidebarCollapsed: false,

      setColumnOrder: (order) => set({ columnOrder: order }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addCountry: (country) => set((state) => ({  
        countries: [...state.countries, { ...country, id: uuidv4() }] 
      })),
      
      updateCountry: (id, data) => set((state) => ({
        countries: state.countries.map((c) => c.id === id ? { ...c, ...data } : c)
      })),
      
      deleteCountry: (id) => set((state) => ({
        countries: state.countries.filter((c) => c.id !== id),
        // Clean up product assignments for the deleted country
        products: state.products.map(p => ({
          ...p,
          countryIds: p.countryIds ? p.countryIds.filter(cid => cid !== id) : []
        }))
      })),

      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: uuidv4(), countryIds: product.countryIds || [] }]
      })),

      addProducts: (newProducts) => set((state) => ({
        products: [...state.products, ...newProducts.map(p => ({ ...p, id: uuidv4(), countryIds: p.countryIds || [] }))]
      })),

      updateProduct: (id, data) => set((state) => ({
        products: state.products.map((p) => p.id === id ? { ...p, ...data } : p)
      })),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id)
      })),

      deleteProducts: (ids) => set((state) => ({
        products: state.products.filter((p) => !ids.includes(p.id))
      })),

      updateAnalysis: (countryId, productId, data) => set((state) => {
        const countryAnalysis = state.analysis[countryId] || {};
        const productAnalysis = countryAnalysis[productId] || {};
        
        return {
          analysis: {
            ...state.analysis,
            [countryId]: {
              ...countryAnalysis,
              [productId]: { ...productAnalysis, ...data }
            }
          }
        };
      }),

      seed: () => {
        if (get().countries.length === 0) {
          const usId = 'us';
          const ukId = 'uk';
          const deId = 'de';
          set({
            countries: [
              { id: usId, name: 'United States', currency: 'USD', defaultShipping: 5, defaultCod: 0, defaultReturn: 2 },
              { id: ukId, name: 'United Kingdom', currency: 'GBP', defaultShipping: 4, defaultCod: 0, defaultReturn: 1.5 },
              { id: deId, name: 'Germany', currency: 'EUR', defaultShipping: 4.5, defaultCod: 2, defaultReturn: 0 },
            ],
            products: [
              { id: '1', sku: 'TSHIRT-BLK-M', name: 'Classic Black T-Shirt (M)', status: 'Active', cost: 5, price: 25, countryIds: [usId, ukId] },
              { id: '2', sku: 'MUG-WHT', name: 'Ceramic White Mug', status: 'Active', cost: 2, price: 12, countryIds: [usId] },
              { id: '3', sku: 'NB-LEA', name: 'Leather Notebook', status: 'Draft', cost: 8, price: 30, countryIds: [usId, ukId, deId] },
              { id: '4', sku: 'PEN-GLD', name: 'Gold Ballpoint Pen', status: 'Active', cost: 1.5, price: 15, countryIds: [ukId, deId] },
            ]
          });
        }
        
        if (get().fbAdsTable.length === 0) {
          set({
            fbAdsTable: [
              { campaignId: "cmp_1", campaignName: "Winter Sales", adSetId: "adset_1", adSetName: "Broad – Men", adId: "ad_1", adName: "Creative 1", status: "Active" },
              { campaignId: "cmp_1", campaignName: "Winter Sales", adSetId: "adset_1", adSetName: "Broad – Men", adId: "ad_2", adName: "Creative 2", status: "Active" },
              { campaignId: "cmp_1", campaignName: "Winter Sales", adSetId: "adset_2", adSetName: "Retargeting", adId: "ad_3", adName: "Video 1", status: "Paused" },
              { campaignId: "cmp_2", campaignName: "Testing", adSetId: "adset_3", adSetName: "ABO Test", adId: "ad_4", adName: "Image A", status: "Active" },
              { campaignId: "cmp_2", campaignName: "Testing", adSetId: "adset_3", adSetName: "ABO Test", adId: "ad_5", adName: "Image B", status: "Active" },
              { campaignId: "cmp_3", campaignName: "Summer Promo", adSetId: "adset_4", adSetName: "Interests - Tech", adId: "ad_6", adName: "Carousel 1", status: "Active" },
            ]
          });
        }
      }
    }),
    {
      name: 'ecommerce-kpi-storage-v2',
    }
  )
);
