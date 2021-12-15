import flatCache from 'flat-cache';
import cache from '../src/utils/cache';

let cacheStore;

describe('Cache', () => {
  beforeAll(() => {
    cacheStore = flatCache.load(':test', ':in_memory');
  });

  it('can store key with expiration', () => {
    jest.useFakeTimers();
    expect(cache(cacheStore).get('test')).toBeUndefined();
    cache(cacheStore).set('test', 'test-value', 10);
    expect(cache(cacheStore).get('test')).toBe('test-value');
    jest.advanceTimersByTime(5000);
    expect(cache(cacheStore).get('test')).toBe('test-value');
    jest.advanceTimersByTime(11000);
    expect(cache(cacheStore).get('test')).toBeUndefined();
  });
});
