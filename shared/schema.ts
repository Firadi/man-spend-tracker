import { pgTable, text, serial, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const countries = pgTable("countries", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  code: text("code").notNull(),
  defaultShipping: real("default_shipping").default(0).notNull(),
  defaultCod: real("default_cod").default(0).notNull(),
  defaultReturn: real("default_return").default(0).notNull(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(), // 'Draft' | 'Active'
  cost: real("cost").default(0).notNull(),
  price: real("price").default(0).notNull(),
  image: text("image"),
  countryIds: jsonb("country_ids").$type<string[]>().default([]).notNull(),
});

export const analysis = pgTable("analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  countryId: text("country_id").notNull(), // references countries.id (manual constraint since country.id is text)
  productId: text("product_id").notNull(), // references products.id
  revenue: real("revenue").default(0),
  ads: real("ads").default(0),
  serviceFees: real("service_fees").default(0),
  productFees: real("product_fees").default(0),
  deliveredOrders: real("delivered_orders").default(0),
  totalOrders: real("total_orders").default(0),
  ordersConfirmed: real("orders_confirmed").default(0),
});

export const simulations = pgTable("simulations", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  date: text("date").notNull(),
  inputs: jsonb("inputs").notNull(),
  results: jsonb("results").notNull(),
});

export const dailyAds = pgTable("daily_ads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: text("product_id").notNull(),
  date: text("date").notNull(),
  amount: real("amount").default(0).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCountrySchema = createInsertSchema(countries).omit({ 
  userId: true 
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  userId: true 
});

export const insertAnalysisSchema = createInsertSchema(analysis).omit({ 
  id: true,
  userId: true 
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({ 
  userId: true 
});

export const insertDailyAdSchema = createInsertSchema(dailyAds).omit({
  id: true,
  userId: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type InsertDailyAd = z.infer<typeof insertDailyAdSchema>;

export type User = typeof users.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Analysis = typeof analysis.$inferSelect;
export type Simulation = typeof simulations.$inferSelect;
export type DailyAd = typeof dailyAds.$inferSelect;

