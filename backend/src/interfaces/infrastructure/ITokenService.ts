export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
  residentCode?: string;
}

export interface ITokenService {
  generateAccessToken(payload: ITokenPayload): string;
  generateRefreshToken(payload: ITokenPayload): string;
  verifyAccessToken(token: string): any;
  verifyRefreshToken(token: string): any;
}
