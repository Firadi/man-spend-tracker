import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCountrySchema, insertProductSchema, insertAnalysisSchema, insertSimulationSchema, insertDailyAdSchema, insertAnalysisSnapshotSchema } from "@shared/schema";
import { z } from "zod";

function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

function ensureAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && (req.user as any).role === 'admin') {
    return next();
  }
  res.status(403).send("Forbidden");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Countries
  app.get("/api/countries", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const countries = await storage.getCountries(user.id);
    res.json(countries);
  });

  app.post("/api/countries", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = insertCountrySchema.parse(req.body);
    const country = await storage.createCountry(user.id, data);
    res.status(201).json(country);
  });

  app.put("/api/countries/:id", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = insertCountrySchema.partial().parse(req.body);
    const country = await storage.updateCountry(user.id, req.params.id, data);
    res.json(country);
  });

  app.delete("/api/countries/:id", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    await storage.deleteCountry(user.id, req.params.id);
    res.sendStatus(204);
  });

  // Products
  app.get("/api/products", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const products = await storage.getProducts(user.id);
    res.json(products);
  });

  app.post("/api/products", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(user.id, data);
    res.status(201).json(product);
  });

  app.put("/api/products/:id", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = insertProductSchema.partial().parse(req.body);
    const product = await storage.updateProduct(user.id, req.params.id, data);
    res.json(product);
  });

  app.delete("/api/products/:id", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    await storage.deleteProduct(user.id, req.params.id);
    res.sendStatus(204);
  });

  // Analysis
  app.get("/api/analysis", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const analysis = await storage.getAnalysis(user.id);
    // Convert array to map format for frontend compatibility
    const analysisMap: Record<string, Record<string, any>> = {};
    for (const item of analysis) {
      if (!analysisMap[item.countryId]) {
        analysisMap[item.countryId] = {};
      }
      analysisMap[item.countryId][item.productId] = item;
    }
    res.json(analysisMap);
  });

  app.post("/api/analysis/:countryId/:productId", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = insertAnalysisSchema.partial().parse(req.body);
    const analysis = await storage.updateAnalysis(user.id, req.params.countryId, req.params.productId, data);
    res.json(analysis);
  });

  // Simulations
  app.get("/api/simulations", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const simulations = await storage.getSimulations(user.id);
    res.json(simulations);
  });

  app.post("/api/simulations", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = insertSimulationSchema.parse(req.body);
    const simulation = await storage.createSimulation(user.id, data);
    res.status(201).json(simulation);
  });

  app.delete("/api/simulations/:id", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    await storage.deleteSimulation(user.id, req.params.id);
    res.sendStatus(204);
  });

  // Daily Ads
  app.get("/api/daily-ads/totals", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { startDate, endDate } = req.query;
    const totals = await storage.getDailyAdsTotals(
      user.id,
      startDate as string | undefined,
      endDate as string | undefined
    );
    const map: Record<string, number> = {};
    for (const t of totals) {
      map[t.productId] = t.total;
    }
    res.json(map);
  });

  app.get("/api/daily-ads", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { startDate, endDate } = req.query;
    const ads = await storage.getDailyAds(
      user.id,
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(ads);
  });

  app.post("/api/daily-ads", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const entries = z.array(insertDailyAdSchema).parse(req.body);
    const saved = await storage.saveDailyAds(user.id, entries);
    res.json(saved);
  });

  // Analysis Snapshots
  app.get("/api/analysis-snapshots", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const snapshots = await storage.getAnalysisSnapshots(user.id);
    res.json(snapshots);
  });

  app.post("/api/analysis-snapshots", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = insertAnalysisSnapshotSchema.parse(req.body);
    const snapshot = await storage.createAnalysisSnapshot(user.id, data);
    res.status(201).json(snapshot);
  });

  app.put("/api/analysis-snapshots/:id", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: "Update data is required" });
    }
    const updated = await storage.updateAnalysisSnapshot(user.id, req.params.id, data);
    if (!updated) return res.status(404).json({ error: "Snapshot not found" });
    res.json(updated);
  });

  app.delete("/api/analysis-snapshots/:id", ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    await storage.deleteAnalysisSnapshot(user.id, req.params.id);
    res.sendStatus(204);
  });

  // Admin Routes
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    const safeUsers = allUsers.map(u => ({ id: u.id, username: u.username, role: u.role, email: u.email }));
    res.json(safeUsers);
  });

  app.post("/api/admin/users", ensureAdmin, async (req, res, next) => {
    try {
      const { username, password, role, email } = req.body;
      if (!username || !password) {
        return res.status(400).send("Username and password are required");
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).send("Username already exists");
      }
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });
      const updates: any = {};
      if (role && role !== 'user') updates.role = role;
      if (email) updates.email = email;
      if (Object.keys(updates).length > 0) {
        await storage.updateUser(user.id, updates);
      }
      res.status(201).json({ id: user.id, username: user.username, role: role || 'user', email: email || null });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", ensureAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const adminUser = req.user as any;
      if (userId === adminUser.id) {
        return res.status(400).send("Cannot delete your own account");
      }
      await storage.deleteUser(userId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/users/:id", ensureAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const { role, password, email } = req.body;
      const updates: any = {};
      if (role) updates.role = role;
      if (password) {
        const { hashPassword } = await import("./auth");
        updates.password = await hashPassword(password);
      }
      if (email !== undefined) updates.email = email;
      const updated = await storage.updateUser(userId, updates);
      res.json({ id: updated.id, username: updated.username, role: updated.role, email: updated.email });
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
