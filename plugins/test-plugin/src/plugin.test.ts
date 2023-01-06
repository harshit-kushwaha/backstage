import { testPluginPlugin } from './plugin';

describe('test-plugin', () => {
  it('should export plugin', () => {
    expect(testPluginPlugin).toBeDefined();
  });
});
