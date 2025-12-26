import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Store application settings (like the Premium Key)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  keyName: text("key_name").notNull().unique(), // e.g. "premium_key"
  value: text("value").notNull(),               // e.g. "vinababy"
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Log sharing activities (optional, for admin or persistence)
export const shareLogs = pgTable("share_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "normal" or "premium"
  targetLink: text("target_link").notNull(),
  count: integer("count").notNull(),
  status: text("status").notNull(), // "completed", "failed"
  timestamp: timestamp("timestamp").defaultNow(),
});

// Community chat users
export const chatUsers = pgTable("chat_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"), // URL to avatar image
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  message: text("message").notNull(),
  image: text("image"), // URL to image in message
  createdAt: timestamp("created_at").defaultNow(),
});

// Greetings and events with effects
export const greetings = pgTable("greetings", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull().unique(), // "christmas", "newyear", etc
  greeting: text("greeting").notNull(),
  effects: text("effects"), // "snowfall", "confetti", etc
  bgColor: text("bg_color"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Music playlists
export const musicPlaylists = pgTable("music_playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  songs: text("songs"), // JSON array of song URLs
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });
export const insertLogSchema = createInsertSchema(shareLogs).omit({ id: true, timestamp: true });
export const insertChatUserSchema = createInsertSchema(chatUsers).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertGreetingSchema = createInsertSchema(greetings).omit({ id: true, createdAt: true });
export const insertMusicPlaylistSchema = createInsertSchema(musicPlaylists).omit({ id: true, createdAt: true });

// === TYPES ===
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;
export type ShareLog = typeof shareLogs.$inferSelect;
export type InsertShareLog = z.infer<typeof insertLogSchema>;
export type ChatUser = typeof chatUsers.$inferSelect;
export type InsertChatUser = z.infer<typeof insertChatUserSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Greeting = typeof greetings.$inferSelect;
export type InsertGreeting = z.infer<typeof insertGreetingSchema>;
export type MusicPlaylist = typeof musicPlaylists.$inferSelect;
export type InsertMusicPlaylist = z.infer<typeof insertMusicPlaylistSchema>;

// === API CONTRACT TYPES ===

// Login for Admin
export const adminLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;

// Request to validate premium key
export const validateKeySchema = z.object({
  key: z.string(),
});
export type ValidateKeyRequest = z.infer<typeof validateKeySchema>;

// Share Task Configuration
export const shareTaskSchema = z.object({
  cookies: z.array(z.string()).min(1, "At least one cookie is required"),
  link: z.string().url("Invalid URL"),
  limit: z.number().min(1).max(10000),
  delay: z.number().min(0).default(1000), // ms for normal, calculated for premium
  mode: z.enum(["normal", "premium"]),
  premiumKey: z.string().optional(), // Required if mode is premium (and trial used up)
});
export type ShareTaskRequest = z.infer<typeof shareTaskSchema>;

// Chat registration
export const chatRegisterSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
});
export type ChatRegisterRequest = z.infer<typeof chatRegisterSchema>;

// Chat login
export const chatLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type ChatLoginRequest = z.infer<typeof chatLoginSchema>;

// Chat message
export const sendMessageSchema = z.object({
  userId: z.number(),
  message: z.string().min(1),
  image: z.string().optional(),
});
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;

// Greeting setup
export const greetingSetupSchema = z.object({
  eventName: z.string(),
  greeting: z.string(),
  effects: z.string().optional(),
  bgColor: z.string().optional(),
});
export type GreetingSetupRequest = z.infer<typeof greetingSetupSchema>;

// Streaming Log Message
export type LogMessage = {
  id: string;
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
};
