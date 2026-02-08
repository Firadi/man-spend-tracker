import { type User, type InsertUser, type Country, type InsertCountry, type Product, type InsertProduct, type Analysis, type Simulation, type InsertSimulation, type DailyAd, type InsertDailyAd, type AnalysisSnapshot, type InsertAnalysisSnapshot, users, countries, products, analysis, simulations, dailyAds, analysisSnapshots } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

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

  // Daily Ads
  getDailyAds(userId: number, startDate?: string, endDate?: string): Promise<DailyAd[]>;
  saveDailyAds(userId: number, entries: InsertDailyAd[]): Promise<DailyAd[]>;
  getDailyAdsTotals(userId: number, startDate?: string, endDate?: string): Promise<{ productId: string; total: number }[]>;

  // Analysis Snapshots
  getAnalysisSnapshots(userId: number): Promise<AnalysisSnapshot[]>;
  createAnalysisSnapshot(userId: number, snapshot: InsertAnalysisSnapshot): Promise<AnalysisSnapshot>;
  deleteAnalysisSnapshot(userId: number, id: string): Promise<void>;

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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(dailyAds).where(eq(dailyAds.userId, id));
    await db.delete(analysisSnapshots).where(eq(analysisSnapshots.userId, id));
    await db.delete(analysis).where(eq(analysis.userId, id));
    await db.delete(simulations).where(eq(simulations.userId, id));
    await db.delete(products).where(eq(products.userId, id));
    await db.delete(countries).where(eq(countries.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    if (!updated) throw new Error("User not found");
    return updated;
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

  async getDailyAds(userId: number, startDate?: string, endDate?: string): Promise<DailyAd[]> {
    const conditions = [eq(dailyAds.userId, userId)];
    if (startDate) conditions.push(gte(dailyAds.date, startDate));
    if (endDate) conditions.push(lte(dailyAds.date, endDate));
    return await db.select().from(dailyAds).where(and(...conditions));
  }

  async saveDailyAds(userId: number, entries: InsertDailyAd[]): Promise<DailyAd[]> {
    const results: DailyAd[] = [];
    for (const entry of entries) {
      const existing = await db.select().from(dailyAds).where(
        and(
          eq(dailyAds.userId, userId),
          eq(dailyAds.productId, entry.productId),
          eq(dailyAds.date, entry.date)
        )
      );
      if (existing.length > 0) {
        const [updated] = await db
          .update(dailyAds)
          .set({ amount: entry.amount })
          .where(eq(dailyAds.id, existing[0].id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db
          .insert(dailyAds)
          .values({ ...entry, userId })
          .returning();
        results.push(created);
      }
    }
    return results;
  }

  async getDailyAdsTotals(userId: number, startDate?: string, endDate?: string): Promise<{ productId: string; total: number }[]> {
    const conditions = [eq(dailyAds.userId, userId)];
    if (startDate) conditions.push(gte(dailyAds.date, startDate));
    if (endDate) conditions.push(lte(dailyAds.date, endDate));
    const result = await db
      .select({
        productId: dailyAds.productId,
        total: sql<number>`COALESCE(SUM(${dailyAds.amount}), 0)`.as('total'),
      })
      .from(dailyAds)
      .where(and(...conditions))
      .groupBy(dailyAds.productId);
    return result.map(r => ({ productId: r.productId, total: Number(r.total) }));
  }

  async getAnalysisSnapshots(userId: number): Promise<AnalysisSnapshot[]> {
    return await db.select().from(analysisSnapshots).where(eq(analysisSnapshots.userId, userId)).orderBy(desc(analysisSnapshots.createdAt));
  }

  async createAnalysisSnapshot(userId: number, snapshot: InsertAnalysisSnapshot): Promise<AnalysisSnapshot> {
    const [created] = await db.insert(analysisSnapshots).values({ ...snapshot, userId }).returning();
    return created;
  }

  async updateAnalysisSnapshot(userId: number, id: string, data: { periodName: string }): Promise<AnalysisSnapshot | null> {
    const [updated] = await db.update(analysisSnapshots).set({ periodName: data.periodName }).where(and(eq(analysisSnapshots.id, id), eq(analysisSnapshots.userId, userId))).returning();
    return updated || null;
  }

  async deleteAnalysisSnapshot(userId: number, id: string): Promise<void> {
    await db.delete(analysisSnapshots).where(and(eq(analysisSnapshots.id, id), eq(analysisSnapshots.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
