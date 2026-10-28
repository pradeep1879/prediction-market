import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string; // Or number, depending on your database IDs
    }
  }
}