import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";

export type ProductStatus = 'Draft' | 'Active';

export interface Country {
  id: string;
  name: string;
  currency: string;
  code: string;
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

// Map: CountryID -> ProductID -> Override
export interface AnalysisState {
  [countryId: string]: {
    [productId: string]: AnalysisOverride;
  };
}

export interface SimulationData {
  id: string;
  name: string;
  date: string;
  inputs: {
    totalOrders: number;
    confirmationRate: number;
    deliveryRate: number;
    sellingPrice: number;
    productCost: number;
    serviceFee: number;
    adsCost: number;
    otherCost: number;
  };
  results: {
    confirmedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    profitPerDelivered: number;
  };
}

interface AppState {
  countries: Country[];
  products: Product[];
  analysis: AnalysisState;
  simulations: SimulationData[];

  // Fetch Actions
  fetchData: () => Promise<void>;

  addCountry: (country: Omit<Country, 'id'>) => Promise<void>;
  updateCountry: (id: string, data: Partial<Country>) => Promise<void>;
  deleteCountry: (id: string) => Promise<void>;

  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteProducts: (ids: string[]) => Promise<void>;

  updateAnalysis: (countryId: string, productId: string, data: AnalysisOverride) => Promise<void>;
  
  // Simulations
  saveSimulation: (simulation: Omit<SimulationData, 'id' | 'date'>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;

  // Column reordering
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;


  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  seed: () => void;
}

export const useStore = create<AppState>((set, get) => ({
      countries: [],
      products: [],
      analysis: {},
      simulations: [],
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

      fetchData: async () => {
        // Mock data initialization
        if (get().countries.length === 0) {
          const dummyCountries: Country[] = [
            { id: '1', name: 'United States', currency: 'USD', code: 'US', defaultShipping: 5, defaultCod: 0, defaultReturn: 2 },
            { id: '2', name: 'Germany', currency: 'EUR', code: 'DE', defaultShipping: 4, defaultCod: 1, defaultReturn: 3 },
          ];
          
          const dummyProducts: Product[] = [
            { id: '1', sku: 'SKU-001', name: 'Wireless Headphones', status: 'Active', cost: 15, price: 59, countryIds: ['1', '2'] },
            { id: '2', sku: 'SKU-002', name: 'Smartphone Stand', status: 'Draft', cost: 2, price: 15, countryIds: ['1'] },
          ];
          
          set({ countries: dummyCountries, products: dummyProducts });
        }
      },

      saveSimulation: async (simulation) => {
        const saved = {
          ...simulation,
          id: uuidv4(),
          date: new Date().toISOString()
        };
        set((state) => ({
          simulations: [saved, ...(state.simulations || [])]
        }));
      },

      deleteSimulation: async (id) => {
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== id)
        }));
      },

      setColumnOrder: (order) => set({ columnOrder: order }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addCountry: async (country) => {
        const saved = { ...country, id: uuidv4() };
        set((state) => ({  
          countries: [...state.countries, saved] 
        }));
      },
      
      updateCountry: async (id, data) => {
        set((state) => ({
          countries: state.countries.map((c) => c.id === id ? { ...c, ...data } : c)
        }));
      },
      
      deleteCountry: async (id) => {
        set((state) => ({
          countries: state.countries.filter((c) => c.id !== id),
          products: state.products.map(p => ({
            ...p,
            countryIds: p.countryIds ? p.countryIds.filter(cid => cid !== id) : []
          }))
        }));
      },

      addProduct: async (product) => {
        const saved = { ...product, id: uuidv4(), countryIds: product.countryIds || [] };
        set((state) => ({
          products: [...state.products, saved]
        }));
      },

      addProducts: async (newProducts) => {
        const savedProducts = newProducts.map(p => ({ ...p, id: uuidv4(), countryIds: p.countryIds || [] }));
        set((state) => ({
          products: [...state.products, ...savedProducts]
        }));
      },

      updateProduct: async (id, data) => {
        set((state) => ({
          products: state.products.map((p) => p.id === id ? { ...p, ...data } : p)
        }));
      },

      deleteProduct: async (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id)
        }));
      },

      deleteProducts: async (ids) => {
        set((state) => ({
          products: state.products.filter((p) => !ids.includes(p.id))
        }));
      },

      updateAnalysis: async (countryId, productId, data) => {
        set((state) => {
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
        });
      },

      seed: () => {
         // No-op
      }
}));
