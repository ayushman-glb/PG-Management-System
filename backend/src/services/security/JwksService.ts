import { JwtKeyService } from './JwtKeyService';

export class JwksService {
  /**
   * Retrieves active JWKS (JSON Web Key Set) for external token verifiers.
   */
  public static getJwks(): { keys: any[] } {
    return JwtKeyService.getJwks();
  }

  /**
   * Triggers zero-downtime key rotation.
   */
  public static rotateKey(): string {
    return JwtKeyService.rotateKey();
  }
}
