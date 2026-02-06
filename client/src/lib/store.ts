import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest } from './queryClient';
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

  // Column reordering (Local preference, persisted in local storage manually if needed, or just memory)
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;


  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  seed: () => void; // Deprecated/Empty for SaaS mode
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
        try {
          const [countriesRes, productsRes, analysisRes, simulationsRes] = await Promise.all([
            apiRequest("GET", "/api/countries"),
            apiRequest("GET", "/api/products"),
            apiRequest("GET", "/api/analysis"),
            apiRequest("GET", "/api/simulations")
          ]);
          
          const countries = await countriesRes.json();
          const products = await productsRes.json();
          const analysis = await analysisRes.json();
          const simulations = await simulationsRes.json();

          set({ countries, products, analysis, simulations });
        } catch (error) {
          console.error("Failed to fetch data:", error);
        }
      },

      saveSimulation: async (simulation) => {
        const res = await apiRequest("POST", "/api/simulations", {
          ...simulation,
          id: uuidv4(),
          date: new Date().toISOString()
        });
        const saved = await res.json();
        set((state) => ({
          simulations: [saved, ...(state.simulations || [])]
        }));
      },

      deleteSimulation: async (id) => {
        await apiRequest("DELETE", `/api/simulations/${id}`);
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== id)
        }));
      },

      setColumnOrder: (order) => set({ columnOrder: order }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addCountry: async (country) => {
        const res = await apiRequest("POST", "/api/countries", { ...country, id: uuidv4() });
        const saved = await res.json();
        set((state) => ({  
          countries: [...state.countries, saved] 
        }));
      },
      
      updateCountry: async (id, data) => {
        const res = await apiRequest("PUT", `/api/countries/${id}`, data);
        const updated = await res.json();
        set((state) => ({
          countries: state.countries.map((c) => c.id === id ? updated : c)
        }));
      },
      
      deleteCountry: async (id) => {
        await apiRequest("DELETE", `/api/countries/${id}`);
        set((state) => ({
          countries: state.countries.filter((c) => c.id !== id),
          // Clean up product assignments for the deleted country
          products: state.products.map(p => ({
            ...p,
            countryIds: p.countryIds ? p.countryIds.filter(cid => cid !== id) : []
          }))
        }));
      },

      addProduct: async (product) => {
        const res = await apiRequest("POST", "/api/products", { ...product, id: uuidv4(), countryIds: product.countryIds || [] });
        const saved = await res.json();
        set((state) => ({
          products: [...state.products, saved]
        }));
      },

      addProducts: async (newProducts) => {
        // Parallel requests for bulk add (or add bulk endpoint later)
        await Promise.all(newProducts.map(p => 
          apiRequest("POST", "/api/products", { ...p, id: uuidv4(), countryIds: p.countryIds || [] })
        ));
        // Refresh full list to be safe or append
        await get().fetchData();
      },

      updateProduct: async (id, data) => {
        const res = await apiRequest("PUT", `/api/products/${id}`, data);
        const updated = await res.json();
        set((state) => ({
          products: state.products.map((p) => p.id === id ? updated : p)
        }));
      },

      deleteProduct: async (id) => {
        await apiRequest("DELETE", `/api/products/${id}`);
        set((state) => ({
          products: state.products.filter((p) => p.id !== id)
        }));
      },

      deleteProducts: async (ids) => {
        await Promise.all(ids.map(id => apiRequest("DELETE", `/api/products/${id}`)));
        set((state) => ({
          products: state.products.filter((p) => !ids.includes(p.id))
        }));
      },

      updateAnalysis: async (countryId, productId, data) => {
        const res = await apiRequest("POST", `/api/analysis/${countryId}/${productId}`, data);
        const saved = await res.json();
        
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
         // No-op for SaaS
      }
}));
