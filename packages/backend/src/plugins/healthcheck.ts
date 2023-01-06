import { createStatusCheckRouter } from '@backstage/backend-common';
import { PluginEnvironment } from '../types';
import axios from "axios"
// import Router from 'express-promise-router';

export default async function createRouter({ logger }: PluginEnvironment, routes: {path: string, handler: any, healthEndpoint?: string}[]) {

  const statusCheck = async() => {
    console.log("**** executing statuscheck method", routes)
    const paths = routes.map(r => r.path)
    console.log("**** paths", paths)
    await Promise.all(
      routes.map(route => axios.get(`http://localhost:7007/api${route.path}${route.healthEndpoint ?? '/health'}`))
    ).catch(err => Promise.reject({
      status: "error"
    }))
    return Promise.resolve({status: "ok"})
  }

  return await createStatusCheckRouter({ logger, path: '/liveliness', statusCheck });
}