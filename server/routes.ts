import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCountrySchema, insertProductSchema, insertAnalysisSchema, insertSimulationSchema, insertDailyAdSchema } from "@shared/schema";
import { z } from "zod";

function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
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
    const totals = await storage.getDailyAdsTotals(user.id);
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

  return httpServer;
}
