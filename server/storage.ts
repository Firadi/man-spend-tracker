import { type User, type InsertUser, type Country, type InsertCountry, type Product, type InsertProduct, type Analysis, type Simulation, type InsertSimulation, users, countries, products, analysis, simulations } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Countries
  getCountries(userId: number): Promise<Country[]>;
  createCountry(userId: number, country: InsertCountry): Promise<Country>;
  updateCountry(userId: number, id: string, country: Partial<Country>): Promise<Country>;
  deleteCountry(userId: number, id: string): Promise<void>;

  // Products
  getProducts(userId: number): Promise<Product[]>;
  createProduct(userId: number, product: InsertProduct): Promise<Product>;
  updateProduct(userId: number, id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(userId: number, id: string): Promise<void>;

  // Analysis
  getAnalysis(userId: number): Promise<Analysis[]>;
  updateAnalysis(userId: number, countryId: string, productId: string, data: Partial<Analysis>): Promise<Analysis>;

  // Simulations
  getSimulations(userId: number): Promise<Simulation[]>;
  createSimulation(userId: number, simulation: InsertSimulation): Promise<Simulation>;
  deleteSimulation(userId: number, id: string): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCountries(userId: number): Promise<Country[]> {
    return await db.select().from(countries).where(eq(countries.userId, userId));
  }

  async createCountry(userId: number, country: InsertCountry): Promise<Country> {
    const [newCountry] = await db.insert(countries).values({ ...country, userId }).returning();
    return newCountry;
  }

  async updateCountry(userId: number, id: string, data: Partial<Country>): Promise<Country> {
    const [updated] = await db
      .update(countries)
      .set(data)
      .where(and(eq(countries.id, id), eq(countries.userId, userId)))
      .returning();
    
    if (!updated) throw new Error("Country not found");
    return updated;
  }

  async deleteCountry(userId: number, id: string): Promise<void> {
    await db.delete(countries).where(and(eq(countries.id, id), eq(countries.userId, userId)));
    
    // Clean up product countryIds
    // This is harder in SQL with JSON array. 
    // We would need to fetch all products for user, filter and update.
    // Or just leave it for now as strict consistency might be overkill for this stage.
    // Let's do a fetch-update loop for correctness.
    const userProducts = await this.getProducts(userId);
    for (const p of userProducts) {
      if (p.countryIds.includes(id)) {
        const newIds = p.countryIds.filter(cid => cid !== id);
        await db.update(products)
          .set({ countryIds: newIds })
          .where(eq(products.id, p.id));
      }
    }
  }

  async getProducts(userId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.userId, userId));
  }

  async createProduct(userId: number, product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values({ ...product, userId }).returning();
    return newProduct;
  }

  async updateProduct(userId: number, id: string, data: Partial<Product>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(data)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
      
    if (!updated) throw new Error("Product not found");
    return updated;
  }

  async deleteProduct(userId: number, id: string): Promise<void> {
    await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
  }

  async getAnalysis(userId: number): Promise<Analysis[]> {
    return await db.select().from(analysis).where(eq(analysis.userId, userId));
  }

  async updateAnalysis(userId: number, countryId: string, productId: string, data: Partial<Analysis>): Promise<Analysis> {
    // Upsert logic
    const existing = await db.select().from(analysis).where(
      and(
        eq(analysis.userId, userId),
        eq(analysis.countryId, countryId),
        eq(analysis.productId, productId)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db
        .update(analysis)
        .set(data)
        .where(eq(analysis.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(analysis)
        .values({ ...data, userId, countryId, productId } as any) // Type casting due to partial data in insert
        .returning();
      return created;
    }
  }

  async getSimulations(userId: number): Promise<Simulation[]> {
    return await db.select().from(simulations).where(eq(simulations.userId, userId));
  }

  async createSimulation(userId: number, simulation: InsertSimulation): Promise<Simulation> {
    const [newSim] = await db.insert(simulations).values({ ...simulation, userId }).returning();
    return newSim;
  }

  async deleteSimulation(userId: number, id: string): Promise<void> {
    await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
