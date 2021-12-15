const expiresKey = (key: string) => `${key}_expires`;

const enhancedCache = (cacheStore) => ({
  /**
   * Get key data if not key expired
   *
   * @param key
   * @returns
   */
  get: (key: string) => {
    const expiresStoreKey = expiresKey(key);
    const expiresAt = cacheStore.getKey(expiresStoreKey);

    if (!expiresAt) {
      return undefined;
    }

    // -- check if expired
    const expiresDate = new Date(expiresAt);
    const diff = new Date().getTime() - expiresDate.getTime();
    if (diff > 0) {
      //  -- expired -> remove key
      cacheStore.removeKey(key);
      cacheStore.removeKey(expiresStoreKey);

      return undefined;
    }

    // data is not expired
    return cacheStore.getKey(key);
  },

  /**
   * Store item to cache with custom expires at value
   *
   * @param key
   * @param value
   * @param expiresInSeconds
   */
  set: (key: string, value: any, expiresInSeconds: number) => {
    const expiresDate = new Date(+new Date() + expiresInSeconds * 1000);
    cacheStore.setKey(expiresKey(key), expiresDate.toISOString());
    cacheStore.setKey(key, value);
  },
});

export default enhancedCache;
