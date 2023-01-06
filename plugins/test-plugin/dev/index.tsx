import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { testPluginPlugin, TestPluginPage } from '../src/plugin';

createDevApp()
  .registerPlugin(testPluginPlugin)
  .addPage({
    element: <TestPluginPage />,
    title: 'Root Page',
    path: '/test-plugin'
  })
  .render();
