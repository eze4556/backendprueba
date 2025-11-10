declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  
  interface XssCleanOptions {
    replaceWith?: string;
  }
  
  function xssClean(options?: XssCleanOptions): RequestHandler;
  export = xssClean;
}