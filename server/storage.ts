import { db } from "./db";
import { settings, shareLogs, chatUsers, chatMessages, greetings, musicPlaylists, type Setting, type InsertSetting, type ShareLog, type InsertShareLog, type ChatUser, type InsertChatUser, type ChatMessage, type InsertChatMessage, type Greeting, type InsertGreeting, type MusicPlaylist, type InsertMusicPlaylist } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Settings
  getSetting(keyName: string): Promise<Setting | undefined>;
  updateSetting(keyName: string, value: string): Promise<Setting>;
  
  // Logs
  createLog(log: InsertShareLog): Promise<ShareLog>;
  
  // Chat Users
  createChatUser(user: InsertChatUser): Promise<ChatUser>;
  getChatUserByUsername(username: string): Promise<ChatUser | undefined>;
  getChatUserById(id: number): Promise<ChatUser | undefined>;
  updateChatUser(id: number, updates: Partial<InsertChatUser>): Promise<ChatUser>;
  getAllChatUsers(): Promise<ChatUser[]>;
  
  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  
  // Greetings
  createGreeting(greeting: InsertGreeting): Promise<Greeting>;
  getGreetingByEvent(eventName: string): Promise<Greeting | undefined>;
  updateGreeting(id: number, greeting: Partial<InsertGreeting>): Promise<Greeting>;
  getAllGreetings(): Promise<Greeting[]>;
  
  // Music
  createPlaylist(playlist: InsertMusicPlaylist): Promise<MusicPlaylist>;
  getAllPlaylists(): Promise<MusicPlaylist[]>;
  getPlaylistById(id: number): Promise<MusicPlaylist | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getSetting(keyName: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.keyName, keyName));
    return setting;
  }

  async updateSetting(keyName: string, value: string): Promise<Setting> {
    const [existing] = await db.select().from(settings).where(eq(settings.keyName, keyName));
    
    if (existing) {
      const [updated] = await db.update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings)
        .values({ keyName, value })
        .returning();
      return created;
    }
  }

  async createLog(log: InsertShareLog): Promise<ShareLog> {
    const [created] = await db.insert(shareLogs).values(log).returning();
    return created;
  }

  async createChatUser(user: InsertChatUser): Promise<ChatUser> {
    const [created] = await db.insert(chatUsers).values(user).returning();
    return created;
  }

  async getChatUserByUsername(username: string): Promise<ChatUser | undefined> {
    const [user] = await db.select().from(chatUsers).where(eq(chatUsers.username, username));
    return user;
  }

  async getChatUserById(id: number): Promise<ChatUser | undefined> {
    const [user] = await db.select().from(chatUsers).where(eq(chatUsers.id, id));
    return user;
  }

  async updateChatUser(id: number, updates: Partial<InsertChatUser>): Promise<ChatUser> {
    const [updated] = await db.update(chatUsers)
      .set(updates)
      .where(eq(chatUsers.id, id))
      .returning();
    return updated;
  }

  async getAllChatUsers(): Promise<ChatUser[]> {
    return await db.select().from(chatUsers);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(limit);
  }

  async createGreeting(greeting: InsertGreeting): Promise<Greeting> {
    const [created] = await db.insert(greetings).values(greeting).returning();
    return created;
  }

  async getGreetingByEvent(eventName: string): Promise<Greeting | undefined> {
    const [greeting] = await db.select().from(greetings).where(eq(greetings.eventName, eventName));
    return greeting;
  }

  async updateGreeting(id: number, greeting: Partial<InsertGreeting>): Promise<Greeting> {
    const [updated] = await db.update(greetings)
      .set(greeting)
      .where(eq(greetings.id, id))
      .returning();
    return updated;
  }

  async getAllGreetings(): Promise<Greeting[]> {
    return await db.select().from(greetings);
  }

  async createPlaylist(playlist: InsertMusicPlaylist): Promise<MusicPlaylist> {
    const [created] = await db.insert(musicPlaylists).values(playlist).returning();
    return created;
  }

  async getAllPlaylists(): Promise<MusicPlaylist[]> {
    return await db.select().from(musicPlaylists);
  }

  async getPlaylistById(id: number): Promise<MusicPlaylist | undefined> {
    const [playlist] = await db.select().from(musicPlaylists).where(eq(musicPlaylists.id, id));
    return playlist;
  }
}

export const storage = new DatabaseStorage();
