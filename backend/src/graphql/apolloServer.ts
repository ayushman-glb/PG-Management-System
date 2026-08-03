import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema';
import { resolvers } from './resolvers/index';
import { createContext } from './context';
import { Express, json } from 'express';
import { logger } from '../utils/logger';

export async function setupGraphQLServer(app: Express) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production'
  });

  await server.start();
  app.use(
    '/graphql',
    json(),
    expressMiddleware(server, {
      context: createContext
    })
  );
  logger.info('✅ Production-Ready Hybrid GraphQL Apollo Engine online at /graphql');
}
