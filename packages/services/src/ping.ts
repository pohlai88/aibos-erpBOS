export async function pingService(msg: string) {
  return { ok: true as const, echo: msg };
}
