import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { Request, Response } from "express";
import axios from "axios";

// Helper for formatted streaming logs
function sendLog(res: Response, level: "info" | "success" | "error" | "warning", message: string) {
  const log = JSON.stringify({
    timestamp: new Date().toLocaleTimeString(),
    level,
    message
  });
  res.write(`data: ${log}\n\n`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Initialize default key and admin credentials if not exists
  const existingKey = await storage.getSetting("premium_key");
  if (!existingKey) {
    await storage.updateSetting("premium_key", "vinababy");
  }
  const existingAdmin = await storage.getSetting("admin_username");
  if (!existingAdmin) {
    await storage.updateSetting("admin_username", "vina");
    await storage.updateSetting("admin_password", "vinababy");
  }

  // Auth Routes (Admin)
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = api.auth.login.input.parse(req.body);
    const storedUsername = await storage.getSetting("admin_username");
    const storedPassword = await storage.getSetting("admin_password");
    
    if (storedUsername?.value === username && storedPassword?.value === password) {
      const token = "admin-token-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      res.json({ success: true, token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.get(api.auth.verify.path, async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token && token.startsWith("admin-token-")) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Settings Routes
  app.get(api.settings.get.path, async (req, res) => {
    const key = req.params.key;
    const setting = await storage.getSetting(key);
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }
    res.json({ value: setting.value });
  });

  app.post(api.settings.update.path, async (req, res) => {
    const { key, value } = req.body;
    const updated = await storage.updateSetting(key, value);
    res.json(updated);
  });

  app.post(api.settings.validateKey.path, async (req, res) => {
    const { key } = api.settings.validateKey.input.parse(req.body);
    const storedKey = await storage.getSetting("premium_key");
    const valid = storedKey?.value === key;
    res.json({ valid });
  });

  // Chat Routes
  app.post("/api/chat/register", async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;
      const existing = await storage.getChatUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createChatUser({
        username,
        email,
        password,
        displayName,
      });
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/chat/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getChatUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(100);
      res.json(messages.reverse());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const { userId, username, displayName, message, image } = req.body;
      const msg = await storage.createChatMessage({
        userId,
        username,
        displayName,
        message,
        image,
      });
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/chat/users", async (req, res) => {
    try {
      const users = await storage.getAllChatUsers();
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Greetings Routes
  app.get("/api/greetings", async (req, res) => {
    try {
      const greetings = await storage.getAllGreetings();
      res.json(greetings);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/greetings", async (req, res) => {
    try {
      const { eventName, greeting, effects, bgColor } = req.body;
      const result = await storage.createGreeting({
        eventName,
        greeting,
        effects,
        bgColor,
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/greetings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { greeting, effects, bgColor } = req.body;
      const result = await storage.updateGreeting(id, { greeting, effects, bgColor });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Music Routes
  app.get("/api/music/playlists", async (req, res) => {
    try {
      const playlists = await storage.getAllPlaylists();
      res.json(playlists);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/music/playlists", async (req, res) => {
    try {
      const { name, description, songs } = req.body;
      const result = await storage.createPlaylist({
        name,
        description,
        songs: JSON.stringify(songs),
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Share Route (Streaming)
  app.post(api.share.start.path, async (req, res) => {
    try {
      const { cookies, link, limit, delay, mode, premiumKey } = api.share.start.input.parse(req.body);

      // Validate Premium Key if needed
      if (mode === "premium" && premiumKey) {
        const storedKey = await storage.getSetting("premium_key");
        if (storedKey?.value !== premiumKey) {
          return res.status(403).json({ message: "Invalid Premium Key" });
        }
      }

      // Setup Headers for Streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      sendLog(res, "info", `Starting ${mode.toUpperCase()} sharing process...`);
      sendLog(res, "info", `Target: ${link}`);
      sendLog(res, "info", `Limit: ${limit} shares`);

      // Extract Tokens from Cookies
      sendLog(res, "info", `Extracting tokens from ${cookies.length} cookies...`);
      
      const tokens: string[] = [];
      const validCookies: any[] = [];
      
      // User Agent List
      const ua_list = [
        "Mozilla/5.0 (Linux; Android 10; Wildfire E Lite Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/298.0.0.10.115;]",
        "Mozilla/5.0 (Linux; Android 11; KINGKONG 5 Pro Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/320.0.0.12.108;]",
        "Mozilla/5.0 (Linux; Android 11; G91 Pro Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.126 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/325.0.1.4.108;]"
      ];
      const ua = ua_list[Math.floor(Math.random() * ua_list.length)];

      // Token Extraction Logic
      for (let i = 0; i < cookies.length; i++) {
        try {
          const cookieStr = cookies[i];
          const cookieObj: Record<string, string> = {};
          cookieStr.split(";").forEach(pair => {
            const [k, v] = pair.trim().split("=");
            if (k && v) cookieObj[k] = v;
          });

          const cookieHeader = Object.entries(cookieObj).map(([k,v]) => `${k}=${v}`).join("; ");

          const response = await axios.get("https://business.facebook.com/business_locations", {
            headers: {
              "user-agent": ua,
              "cookie": cookieHeader,
            },
            timeout: 10000
          });

          const tokenMatch = response.data.match(/(EAAG\w+)/);
          if (tokenMatch) {
            tokens.push(tokenMatch[1]);
            validCookies.push(cookieHeader);
            sendLog(res, "success", `Cookie ${i + 1}: Token extracted successfully.`);
          } else {
            sendLog(res, "error", `Cookie ${i + 1}: Failed to extract token.`);
          }
        } catch (e: any) {
          sendLog(res, "error", `Cookie ${i + 1} Error: ${e.message}`);
        }
      }

      if (tokens.length === 0) {
        sendLog(res, "error", "No valid tokens found. Process terminated.");
        res.end();
        return;
      }

      sendLog(res, "info", `Found ${tokens.length} valid accounts. Starting shares...`);

      // Sharing Logic
      let shareCount = 0;
      let errorCount = 0;
      
      const CHUNK_SIZE = mode === "premium" ? 40 : 1;
      const COOLDOWN = mode === "premium" ? 10000 : delay;

      while (shareCount < limit) {
        const batchSize = Math.min(CHUNK_SIZE, limit - shareCount);
        const promises = [];

        for (let j = 0; j < batchSize; j++) {
          const idx = Math.floor(Math.random() * tokens.length);
          const token = tokens[idx];
          const cookie = validCookies[idx];
          const currentNum = shareCount + j + 1;

          const p = axios.post(
            `https://graph.facebook.com/v13.0/me/feed`,
            null, 
            {
              params: {
                link: link,
                published: 0,
                access_token: token
              },
              headers: {
                "user-agent": ua,
                "cookie": cookie
              },
              timeout: 10000
            }
          ).then(() => {
            sendLog(res, "success", `Share #${currentNum} successful.`);
            return true;
          }).catch((e) => {
            const msg = e.response?.data?.error?.message || e.message;
            sendLog(res, "error", `Share #${currentNum} Failed: ${msg}`);
            return false;
          });
          
          promises.push(p);
        }

        const results = await Promise.all(promises);
        const successes = results.filter(r => r).length;
        shareCount += batchSize;
        errorCount += (batchSize - successes);

        if (shareCount < limit) {
          sendLog(res, "warning", `Cooldown active: Waiting ${COOLDOWN/1000}s...`);
          await sleep(COOLDOWN);
        }
      }

      sendLog(res, "info", "=========================");
      sendLog(res, "success", `Task Completed!`);
      sendLog(res, "success", `Total Shares: ${shareCount - errorCount}`);
      sendLog(res, "error", `Total Errors: ${errorCount}`);
      res.end();

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).write(`data: ${JSON.stringify({ level: 'error', message: err.errors[0].message })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ level: 'error', message: err.message })}\n\n`);
      }
      res.end();
    }
  });

  return httpServer;
}
