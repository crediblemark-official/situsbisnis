import { getRedis } from "./redis";
import EventEmitter from "events";
import crypto from "crypto";
import { EventPayload, EventMetadata } from "./event-types";

type EventCallback<T = any> = (_data: T, _metadata: EventMetadata) => void | Promise<void>;
type RequestHandler<T = any, R = any> = (_data: T) => R | Promise<R>;

class EventBus {
  private localEmitter = new EventEmitter();
  private subClient: any = null;
  private pubClient: any = null;
  private channels = new Set<string>();
  private requestChannels = new Set<string>();
  private replyChannels = new Set<string>();
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

        // Handler pesan masuk Redis terpusat
        this.subClient.on("message", (channel: string, message: string) => {
          try {
            const payload = JSON.parse(message);
            
            if (channel.startsWith("event:request:")) {
              const reqChannel = channel.replace(/^event:request:/, "");
              this.localEmitter.emit(`request:${reqChannel}`, payload);
            } else if (channel.startsWith("reply:")) {
              this.localEmitter.emit(`reply:${channel}`, payload);
            } else if (channel.startsWith("event:")) {
              const pubChannel = channel.replace(/^event:/, "");
              this.localEmitter.emit(pubChannel, payload);
            }
          } catch (e) {
            console.error(`[EventBus] Gagal parse pesan dari channel ${channel}:`, e);
          }
        });

        this.subClient.on("error", (err: any) => {
          console.warn("[EventBus Warning] Redis Subscribe client error:", err.message || err);
        });

        // Daftarkan ulang semua channel pub/sub biasa
        for (const channel of this.channels) {
          await this.subClient.subscribe(`event:${channel}`);
        }

        // Daftarkan ulang semua request channel
        for (const reqChannel of this.requestChannels) {
          await this.subClient.subscribe(`event:request:${reqChannel}`);
        }

        // Daftarkan ulang semua reply channel aktif
        for (const repChannel of this.replyChannels) {
          await this.subClient.subscribe(repChannel);
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

  /**
   * Mengirimkan request asinkron dan menunggu response (Pola Request/Reply).
   */
  async request<T = any, R = any>(channel: string, data: T, options?: { timeout?: number }): Promise<R> {
    const timeoutMs = options?.timeout || 5000;
    const correlationId = crypto.randomUUID();
    const replyChannel = `reply:${channel}:${correlationId}`;

    const metadata: EventMetadata = {
      eventId: crypto.randomUUID(),
      eventName: channel,
      sourceModule: "caller",
      timestamp: Date.now(),
      correlationId,
      retryCount: 0,
    };

    const requestPayload = {
      data,
      metadata,
      replyTo: replyChannel,
    };

    if (this.pubClient && this.subClient) {
      return new Promise<R>(async (resolve, reject) => {
        let isTimedOut = false;
        
        const timer = setTimeout(async () => {
          isTimedOut = true;
          this.replyChannels.delete(replyChannel);
          this.localEmitter.off(`reply:${replyChannel}`, responseHandler);
          try {
            await this.subClient.unsubscribe(replyChannel);
          } catch (_) {}
          reject(new Error(`[EventBus] Request timeout pada channel ${channel} setelah ${timeoutMs}ms`));
        }, timeoutMs);

        const responseHandler = (payload: any) => {
          if (!isTimedOut) {
            clearTimeout(timer);
            this.replyChannels.delete(replyChannel);
            resolve(payload.data);
            this.subClient.unsubscribe(replyChannel).catch(() => {});
          }
        };

        // Daftarkan listener lokal sekali pakai untuk reply channel
        this.localEmitter.once(`reply:${replyChannel}`, responseHandler);

        try {
          this.replyChannels.add(replyChannel);
          await this.subClient.subscribe(replyChannel);
          if (isTimedOut) return;
          
          await this.pubClient.publish(`event:request:${channel}`, JSON.stringify(requestPayload));
        } catch (e) {
          clearTimeout(timer);
          this.replyChannels.delete(replyChannel);
          this.localEmitter.off(`reply:${replyChannel}`, responseHandler);
          try {
            await this.subClient.unsubscribe(replyChannel);
          } catch (_) {}
          reject(e);
        }
      });
    }

    // Fallback ke In-Memory
    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.localEmitter.off(`reply:${replyChannel}`, responseHandler);
        reject(new Error(`[EventBus In-Memory] Request timeout pada channel ${channel}`));
      }, timeoutMs);

      const responseHandler = (res: any) => {
        clearTimeout(timer);
        resolve(res.data);
      };

      this.localEmitter.once(`reply:${replyChannel}`, responseHandler);
      this.localEmitter.emit(`request:${channel}`, requestPayload);
    });
  }

  /**
   * Mendaftarkan handler untuk menjawab request (Pola Request/Reply).
   */
  async reply<T = any, R = any>(channel: string, handler: RequestHandler<T, R>) {
    // Daftarkan ke Redis jika tersedia
    if (this.subClient) {
      if (!this.requestChannels.has(channel)) {
        this.requestChannels.add(channel);
        try {
          await this.subClient.subscribe(`event:request:${channel}`);
        } catch (e) {
          console.error(`[EventBus] Gagal subscribe request channel ${channel} di Redis:`, e);
        }
      }
    }

    const localHandler = async (requestPayload: any) => {
      try {
        const result = await handler(requestPayload.data);
        const replyPayload = {
          data: result,
          metadata: {
            eventId: crypto.randomUUID(),
            eventName: `reply:${channel}`,
            sourceModule: "responder",
            timestamp: Date.now(),
            correlationId: requestPayload.metadata.correlationId,
            retryCount: 0,
          }
        };

        if (this.pubClient) {
          await this.pubClient.publish(requestPayload.replyTo, JSON.stringify(replyPayload));
        } else {
          // Emit lokal jika in-memory
          this.localEmitter.emit(`reply:${requestPayload.replyTo}`, replyPayload);
        }
      } catch (e) {
        console.error(`[EventBus Reply Error] Gagal memproses request channel ${channel}:`, e);
      }
    };

    this.localEmitter.on(`request:${channel}`, localHandler);

    return () => {
      this.localEmitter.off(`request:${channel}`, localHandler);
    };
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
    this.requestChannels.clear();
    this.replyChannels.clear();
    this.listeners.clear();
    this.localEmitter.removeAllListeners();
  }
}

export const eventBus = new EventBus();
