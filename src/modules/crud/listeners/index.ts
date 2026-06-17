import { registerCrudCacheListener } from "./cache.listener";

export async function initCrudListeners() {
  registerCrudCacheListener();
}
