/**
 * Serializes player-owned draft writes without making the browser authoritative.
 *
 * The caller still supplies the exact snapshot to save and the server still
 * validates it.  This helper only prevents a failed or slow older write from
 * overtaking the next draft or a terminal receipt in the client request order.
 */
export function enqueueSerializedDraftSave<T>(
  chain: { current: Promise<unknown> },
  save: () => Promise<T>,
): Promise<T | null> {
  const request = chain.current
    .catch(() => undefined)
    .then(save)
    .catch(() => null);
  chain.current = request;
  return request;
}
