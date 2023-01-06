/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import Router from 'express-promise-router';
import {
  createServiceBuilder,
  loadBackendConfig,
  getRootLogger,
  useHotMemoize,
  notFoundHandler,
  CacheManager,
  DatabaseManager,
  SingleHostDiscovery,
  UrlReaders,
  ServerTokenManager,
} from '@backstage/backend-common';
import { TaskScheduler } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import app from './plugins/app';
import auth from './plugins/auth';
import catalog from './plugins/catalog';
import scaffolder from './plugins/scaffolder';
import proxy from './plugins/proxy';
import techdocs from './plugins/techdocs';
import search from './plugins/search';
import healthcheck from './plugins/healthcheck';
import testPlugin from './plugins/test-plugin';
import { PluginEnvironment } from './types';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';

function makeCreateEnv(config: Config) {
  const root = getRootLogger();
  const reader = UrlReaders.default({ logger: root, config });
  const discovery = SingleHostDiscovery.fromConfig(config);
  const cacheManager = CacheManager.fromConfig(config);
  const databaseManager = DatabaseManager.fromConfig(config, { logger: root });
  const tokenManager = ServerTokenManager.noop();
  const taskScheduler = TaskScheduler.fromConfig(config);

  const identity = DefaultIdentityClient.create({
    discovery,
  });
  const permissions = ServerPermissionClient.fromConfig(config, {
    discovery,
    tokenManager,
  });

  root.info(`Created UrlReader ${reader}`);

  return (plugin: string): PluginEnvironment => {
    const logger = root.child({ type: 'plugin', plugin });
    const database = databaseManager.forPlugin(plugin);
    const cache = cacheManager.forPlugin(plugin);
    const scheduler = taskScheduler.forPlugin(plugin);
    return {
      logger,
      database,
      cache,
      config,
      reader,
      discovery,
      tokenManager,
      scheduler,
      permissions,
      identity,
    };
  };
}

async function main() {
  const config = await loadBackendConfig({
    argv: process.argv,
    logger: getRootLogger(),
  });
  const createEnv = makeCreateEnv(config);

  const healthcheckEnv = useHotMemoize(module, () => createEnv('healthcheck'));
  const catalogEnv = useHotMemoize(module, () => createEnv('catalog'));
  const scaffolderEnv = useHotMemoize(module, () => createEnv('scaffolder'));
  const authEnv = useHotMemoize(module, () => createEnv('auth'));
  const proxyEnv = useHotMemoize(module, () => createEnv('proxy'));
  const techdocsEnv = useHotMemoize(module, () => createEnv('techdocs'));
  const searchEnv = useHotMemoize(module, () => createEnv('search'));
  const testEnv = useHotMemoize(module, () => createEnv('test-plugin'));
  const appEnv = useHotMemoize(module, () => createEnv('app'));

  const routes = [
    { path: '/catalog', handler: catalog(catalogEnv) },
    { path: '/scaffolder', handler: scaffolder(scaffolderEnv), healthEndpoint: '/v2/tasks'},
    { path: '/auth', handler: auth(authEnv) },
    { path: '/techdocs', handler: techdocs(techdocsEnv) },
    { path: '/proxy', handler: proxy(proxyEnv) },
    { path: '/search', handler: search(searchEnv) },
    { path: '/test', handler: testPlugin(testEnv) },
  ]

  const apiRouter = Router();
  for(const route of routes) {
    apiRouter.use(route.path, await route.handler);
  }
  // apiRouter.use('/catalog', await catalog(catalogEnv));
  // apiRouter.use('/scaffolder', await scaffolder(scaffolderEnv));
  // apiRouter.use('/auth', await auth(authEnv));
  // apiRouter.use('/techdocs', await techdocs(techdocsEnv));
  // apiRouter.use('/proxy', await proxy(proxyEnv));
  // apiRouter.use('/search', await search(searchEnv));
  // apiRouter.use('/test', await testPlugin(testEnv));


  // Add backends ABOVE this line; this 404 handler is the catch-all fallback
  apiRouter.use(notFoundHandler());

  console.log("#### api router", apiRouter)

  const service = createServiceBuilder(module)
    .loadConfig(config)
    .addRouter('/health-check', await healthcheck(healthcheckEnv, routes))
    .addRouter('/api', apiRouter)
    .addRouter('', await app(appEnv));

  await service.start().catch(err => {
    console.log(err);
    process.exit(1);
  });
}

module.hot?.accept();
main().catch(error => {
  console.error('Backend failed to start up', error);
  process.exit(1);
});
