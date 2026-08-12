declare module "hpp" {
  import { RequestHandler } from "express";
  interface HppOptions {
    checkQuery?: boolean;
    checkBody?: boolean;
    checkQueryOnlyFor?: string | string[];
    whitelist?: string | string[];
  }
  function hpp(options?: HppOptions): RequestHandler;
  export = hpp;
}
