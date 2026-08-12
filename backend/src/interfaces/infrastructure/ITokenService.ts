export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
  residentCode?: string;
  tokenVersion?: number;
}

export interface IPreAuthTokenPayload {
  preAuth: true;
  userId: string;
  role: string;
}

export interface ITokenService {
  generateAccessToken(payload: ITokenPayload): string;
  generateRefreshToken(payload: ITokenPayload): string;
  generatePreAuthToken(payload: IPreAuthTokenPayload): string;
  verifyAccessToken(token: string): any;
  verifyRefreshToken(token: string): any;
  verifyPreAuthToken(token: string): any;
}
