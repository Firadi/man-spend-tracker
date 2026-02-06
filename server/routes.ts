import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCountrySchema, insertProductSchema, insertAnalysisSchema, insertSimulationSchema } from "@shared/schema";
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
    const countries = await storage.getCountries(req.user!.id);
    res.json(countries);
  });

  app.post("/api/countries", ensureAuthenticated, async (req, res) => {
    const data = insertCountrySchema.parse(req.body);
    const country = await storage.createCountry(req.user!.id, data);
    res.status(201).json(country);
  });

  app.put("/api/countries/:id", ensureAuthenticated, async (req, res) => {
    const data = insertCountrySchema.partial().parse(req.body);
    const country = await storage.updateCountry(req.user!.id, req.params.id, data);
    res.json(country);
  });

  app.delete("/api/countries/:id", ensureAuthenticated, async (req, res) => {
    await storage.deleteCountry(req.user!.id, req.params.id);
    res.sendStatus(204);
  });

  // Products
  app.get("/api/products", ensureAuthenticated, async (req, res) => {
    const products = await storage.getProducts(req.user!.id);
    res.json(products);
  });

  app.post("/api/products", ensureAuthenticated, async (req, res) => {
    const data = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(req.user!.id, data);
    res.status(201).json(product);
  });

  app.put("/api/products/:id", ensureAuthenticated, async (req, res) => {
    const data = insertProductSchema.partial().parse(req.body);
    const product = await storage.updateProduct(req.user!.id, req.params.id, data);
    res.json(product);
  });

  app.delete("/api/products/:id", ensureAuthenticated, async (req, res) => {
    await storage.deleteProduct(req.user!.id, req.params.id);
    res.sendStatus(204);
  });

  // Analysis
  app.get("/api/analysis", ensureAuthenticated, async (req, res) => {
    const analysis = await storage.getAnalysis(req.user!.id);
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
    const data = insertAnalysisSchema.partial().parse(req.body);
    const analysis = await storage.updateAnalysis(req.user!.id, req.params.countryId, req.params.productId, data);
    res.json(analysis);
  });

  // Simulations
  app.get("/api/simulations", ensureAuthenticated, async (req, res) => {
    const simulations = await storage.getSimulations(req.user!.id);
    res.json(simulations);
  });

  app.post("/api/simulations", ensureAuthenticated, async (req, res) => {
    const data = insertSimulationSchema.parse(req.body);
    const simulation = await storage.createSimulation(req.user!.id, data);
    res.status(201).json(simulation);
  });

  app.delete("/api/simulations/:id", ensureAuthenticated, async (req, res) => {
    await storage.deleteSimulation(req.user!.id, req.params.id);
    res.sendStatus(204);
  });

  return httpServer;
}
