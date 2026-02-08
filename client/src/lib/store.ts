import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest } from './queryClient';

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

export interface DailyAdEntry {
  productId: string;
  date: string;
  amount: number;
}

export interface AnalysisOverride {
  revenue?: number;
  ads?: number;
  serviceFees?: number;
  productFees?: number;
  quantityDelivery?: number;
  deliveredOrders?: number;
  totalOrders?: number;
  ordersConfirmed?: number;
}

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
  
  saveSimulation: (simulation: Omit<SimulationData, 'id' | 'date'>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;

  dailyAds: DailyAdEntry[];
  dailyAdsTotals: Record<string, number>;
  fetchDailyAds: (startDate: string, endDate: string) => Promise<void>;
  saveDailyAds: (entries: DailyAdEntry[]) => Promise<void>;
  fetchDailyAdsTotals: (startDate?: string, endDate?: string) => Promise<void>;

  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  seed: () => void;
}

export const useStore = create<AppState>((set, get) => ({
      countries: [],
      products: [],
      analysis: {},
      simulations: [],
      dailyAds: [],
      dailyAdsTotals: {},
      columnOrder: [
        'product', 
        'totalOrders', 
        'ordersConfirmed', 
        'confirmationRate',
        'deliveredOrders', 
        'quantityDelivery',
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
          const [countriesRes, productsRes, analysisRes, simulationsRes, dailyAdsTotalsRes] = await Promise.all([
            apiRequest("GET", "/api/countries"),
            apiRequest("GET", "/api/products"),
            apiRequest("GET", "/api/analysis"),
            apiRequest("GET", "/api/simulations"),
            apiRequest("GET", "/api/daily-ads/totals")
          ]);
          
          const countries = await countriesRes.json();
          const products = await productsRes.json();
          const analysis = await analysisRes.json();
          const simulations = await simulationsRes.json();
          const dailyAdsTotals = await dailyAdsTotalsRes.json();

          set({ countries, products, analysis, simulations, dailyAdsTotals });
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
        await Promise.all(newProducts.map(p => 
          apiRequest("POST", "/api/products", { ...p, id: uuidv4(), countryIds: p.countryIds || [] })
        ));
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

      fetchDailyAds: async (startDate: string, endDate: string) => {
        try {
          const res = await apiRequest("GET", `/api/daily-ads?startDate=${startDate}&endDate=${endDate}`);
          const data = await res.json();
          set({ dailyAds: data.map((d: any) => ({ productId: d.productId, date: d.date, amount: d.amount })) });
        } catch (error) {
          console.error("Failed to fetch daily ads:", error);
        }
      },

      saveDailyAds: async (entries: DailyAdEntry[]) => {
        const res = await apiRequest("POST", "/api/daily-ads", entries);
        const saved = await res.json();
        set((state) => {
          const updated = [...state.dailyAds];
          for (const entry of entries) {
            const idx = updated.findIndex(d => d.productId === entry.productId && d.date === entry.date);
            if (idx >= 0) {
              updated[idx] = entry;
            } else {
              updated.push(entry);
            }
          }
          return { dailyAds: updated };
        });
        get().fetchDailyAdsTotals();
      },

      fetchDailyAdsTotals: async (startDate?: string, endDate?: string) => {
        try {
          let url = "/api/daily-ads/totals";
          const params = new URLSearchParams();
          if (startDate) params.set("startDate", startDate);
          if (endDate) params.set("endDate", endDate);
          if (params.toString()) url += `?${params.toString()}`;
          const res = await apiRequest("GET", url);
          const data = await res.json();
          set({ dailyAdsTotals: data });
        } catch (error) {
          console.error("Failed to fetch daily ads totals:", error);
        }
      },

      seed: () => {
         // No-op
      }
}));
