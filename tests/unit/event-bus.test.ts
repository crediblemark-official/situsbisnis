import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { eventBus } from "@/modules/shared/core/event-bus";

describe("EventBus Unit Test", () => {
  beforeEach(async () => {
    // Inisialisasi eventBus (akan fallback ke in-memory jika Redis tidak ada)
    await eventBus.init();
  });

  afterEach(async () => {
    // Putuskan koneksi dan bersihkan pendengar agar tidak bocor antar test
    await eventBus.disconnect();
  });

  it("harus dapat melakukan publish dan subscribe secara lokal (in-memory)", async () => {
    const callback = vi.fn();
    
    // Subscribe ke event
    const unsubscribe = await eventBus.subscribe("user.registered", callback);

    const testPayload = {
      userId: "user_123",
      email: "test@example.com",
      name: "Budi"
    };

    // Publikasikan event
    await eventBus.publish("user.registered", testPayload, "auth");

    // Tunggu mikro-task selesai agar event-loop memproses event
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verifikasi callback dipanggil sekali dengan data yang sesuai
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining(testPayload),
      expect.objectContaining({
        eventName: "user.registered",
        sourceModule: "auth",
        correlationId: expect.any(String),
        eventId: expect.any(String),
        timestamp: expect.any(Number)
      })
    );

    // Bersihkan listener
    unsubscribe();
  });

  it("harus tidak memanggil callback setelah unsubscribe dipanggil", async () => {
    const callback = vi.fn();
    const unsubscribe = await eventBus.subscribe("user.registered", callback);

    // Batalkan langganan
    unsubscribe();

    const testPayload = {
      userId: "user_123",
      email: "test@example.com",
      name: "Budi"
    };

    // Publikasikan event lagi
    await eventBus.publish("user.registered", testPayload, "auth");

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Callback seharusnya tidak dipanggil
    expect(callback).not.toHaveBeenCalled();
  });

  it("harus menangani handler asinkron secara aman", async () => {
    let resolvedValue = "";
    
    const asyncCallback = async (data: any) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      resolvedValue = data.name;
    };

    const unsubscribe = await eventBus.subscribe("user.registered", asyncCallback);

    await eventBus.publish("user.registered", { name: "Antigravity" }, "test-module");

    // Tunggu waktu tunggu asinkron
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(resolvedValue).toBe("Antigravity");

    unsubscribe();
  });

  it("harus dapat melakukan Request/Reply secara lokal", async () => {
    // Daftarkan responder
    const unsubscribeReply = await eventBus.reply("request.catalog.countProducts", async (data: { siteId: string }) => {
      expect(data.siteId).toBe("site-xyz");
      return 42;
    });

    // Kirim request
    const response = await eventBus.request("request.catalog.countProducts", { siteId: "site-xyz" });

    // Verifikasi response
    expect(response).toBe(42);

    unsubscribeReply();
  });

  it("harus timeout jika tidak ada responder untuk request", async () => {
    // Jalankan request tanpa responder, atur timeout sangat singkat
    await expect(
      eventBus.request("request.unhandled.channel", { siteId: "site-xyz" }, { timeout: 50 })
    ).rejects.toThrow("Request timeout");
  });
});
