import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const testPluginPlugin = createPlugin({
  id: 'test-plugin',
  routes: {
    root: rootRouteRef,
  },
});

export const TestPluginPage = testPluginPlugin.provide(
  createRoutableExtension({
    name: 'TestPluginPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
