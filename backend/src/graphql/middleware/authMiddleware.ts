import { GraphQLContext } from '../context';
import { GraphQLError } from 'graphql';

export function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('Authentication token required for this operation', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
}

export function requireRole(context: GraphQLContext, allowedRoles: string[]) {
  const user = requireAuth(context);
  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError(
      `Role '${user.role}' does not have permission to perform this operation`,
      { extensions: { code: 'FORBIDDEN' } }
    );
  }
  return user;
}
