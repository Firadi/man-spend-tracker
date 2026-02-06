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
}

export interface AnalysisOverride {
  revenue?: number;
  ads?: number;
  serviceFees?: number;
  productFees?: number;
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
  
  addCountry: (country: Omit<Country, 'id'>) => void;
  updateCountry: (id: string, data: Partial<Country>) => void;
  deleteCountry: (id: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  addProducts: (products: Omit<Product, 'id'>[]) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  updateAnalysis: (countryId: string, productId: string, data: AnalysisOverride) => void;
  
  seed: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      countries: [],
      products: [],
      analysis: {},

      addCountry: (country) => set((state) => ({ 
        countries: [...state.countries, { ...country, id: uuidv4() }] 
      })),
      
      updateCountry: (id, data) => set((state) => ({
        countries: state.countries.map((c) => c.id === id ? { ...c, ...data } : c)
      })),
      
      deleteCountry: (id) => set((state) => ({
        countries: state.countries.filter((c) => c.id !== id)
      })),

      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: uuidv4() }]
      })),

      addProducts: (newProducts) => set((state) => ({
        products: [...state.products, ...newProducts.map(p => ({ ...p, id: uuidv4() }))]
      })),

      updateProduct: (id, data) => set((state) => ({
        products: state.products.map((p) => p.id === id ? { ...p, ...data } : p)
      })),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id)
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
          set({
            countries: [
              { id: 'us', name: 'United States', currency: 'USD', defaultShipping: 5, defaultCod: 0, defaultReturn: 2 },
              { id: 'uk', name: 'United Kingdom', currency: 'GBP', defaultShipping: 4, defaultCod: 0, defaultReturn: 1.5 },
              { id: 'de', name: 'Germany', currency: 'EUR', defaultShipping: 4.5, defaultCod: 2, defaultReturn: 0 },
            ],
            products: [
              { id: '1', sku: 'TSHIRT-BLK-M', name: 'Classic Black T-Shirt (M)', status: 'Active', cost: 5, price: 25 },
              { id: '2', sku: 'MUG-WHT', name: 'Ceramic White Mug', status: 'Active', cost: 2, price: 12 },
              { id: '3', sku: 'NB-LEA', name: 'Leather Notebook', status: 'Draft', cost: 8, price: 30 },
              { id: '4', sku: 'PEN-GLD', name: 'Gold Ballpoint Pen', status: 'Active', cost: 1.5, price: 15 },
            ]
          });
        }
      }
    }),
    {
      name: 'ecommerce-kpi-storage',
    }
  )
);
