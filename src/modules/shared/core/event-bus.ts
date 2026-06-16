import { getRedis } from "./redis";
import EventEmitter from "events";
import crypto from "crypto";
import { EventPayload, EventMetadata } from "./event-types";

type EventCallback<T = any> = (data: T, metadata: EventMetadata) => void | Promise<void>;

class EventBus {
  private localEmitter = new EventEmitter();
  private subClient: any = null;
  private pubClient: any = null;
  private channels = new Set<string>();
  private listeners = new Map<string, Set<EventCallback>>();

  constructor() {
    // Set limit local emitter ke tak terbatas untuk mencegah warning max listeners
    this.localEmitter.setMaxListeners(0);
  }

  async init() {
    try {
      const redis = await getRedis();
      if (redis && !this.pubClient) {
        this.pubClient = redis;
        
        // Buat client Redis baru khusus untuk sub karena client sub tidak boleh menjalankan perintah lain
        const { default: Redis } = await import("ioredis");
        this.subClient = new Redis(process.env.REDIS_URL!, {
          maxRetriesPerRequest: 0,
          connectTimeout: 2000,
        });

        this.subClient.on("message", (channel: string, message: string) => {
          try {
            const payload: EventPayload = JSON.parse(message);
            const channelName = channel.replace(/^event:/, "");
            this.triggerLocal(channelName, payload.data, payload.metadata);
          } catch (e) {
            console.error(`[EventBus] Gagal parse pesan dari channel ${channel}:`, e);
          }
        });

        this.subClient.on("error", (err: any) => {
          console.warn("[EventBus Warning] Redis Subscribe client error:", err.message || err);
        });

        // Daftarkan ulang semua channel yang sudah terlanjur di-subscribe sebelum init selesai
        for (const channel of this.channels) {
          await this.subClient.subscribe(`event:${channel}`);
        }
        
        console.log("🔌 [EventBus] Redis Pub/Sub terhubung dan aktif.");
      } else if (!redis) {
        console.log("ℹ️ [EventBus] Menggunakan mode In-Memory (Redis tidak tersedia).");
      }
    } catch (error) {
      console.error("❌ [EventBus Error] Gagal inisialisasi koneksi Redis Pub/Sub:", error);
    }
  }

  async subscribe<K extends string>(channel: K, callback: EventCallback) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Daftarkan listener ke EventEmitter lokal
    const localCallback = (payload: EventPayload) => {
      try {
        const result = callback(payload.data, payload.metadata);
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`[EventBus] Error dalam handler asinkron untuk channel "${channel}":`, err);
          });
        }
      } catch (err) {
        console.error(`[EventBus] Error dalam handler sinkron untuk channel "${channel}":`, err);
      }
    };

    this.localEmitter.on(channel, localCallback);

    // Daftarkan ke Redis jika tersedia
    if (!this.channels.has(channel)) {
      this.channels.add(channel);
      if (this.subClient) {
        try {
          await this.subClient.subscribe(`event:${channel}`);
        } catch (e) {
          console.error(`[EventBus] Gagal melakukan subscribe ke Redis untuk channel "${channel}":`, e);
        }
      }
    }

    // Mengembalikan fungsi unsubscribe
    return () => {
      this.localEmitter.off(channel, localCallback);
      this.listeners.get(channel)?.delete(callback);
    };
  }

  async publish<K extends string>(channel: K, data: any, sourceModule: string) {
    const correlationId = crypto.randomUUID();
    const metadata: EventMetadata = {
      eventId: crypto.randomUUID(),
      eventName: channel,
      sourceModule,
      timestamp: Date.now(),
      correlationId,
      retryCount: 0,
    };

    const payload: EventPayload = { data, metadata };
    const message = JSON.stringify(payload);

    // Jika Redis Pub/Sub aktif, publikasikan ke Redis
    if (this.pubClient) {
      try {
        await this.pubClient.publish(`event:${channel}`, message);
        return;
      } catch (e) {
        console.error(`[EventBus Error] Gagal kirim pesan ke Redis. Melakukan fallback ke lokal:`, e);
      }
    }

    // Fallback/Default ke lokal in-memory
    this.triggerLocal(channel, data, metadata);
  }

  private triggerLocal(channel: string, data: any, metadata: EventMetadata) {
    const payload: EventPayload = { data, metadata };
    this.localEmitter.emit(channel, payload);
  }

  async disconnect() {
    if (this.subClient) {
      try {
        await this.subClient.quit();
      } catch (_) {}
      this.subClient = null;
    }
    this.pubClient = null;
    this.channels.clear();
    this.listeners.clear();
    this.localEmitter.removeAllListeners();
  }
}

export const eventBus = new EventBus();
