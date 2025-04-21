declare module Express {
  export interface Request {
    expiresIn?: string;
    email?: string;
    password?: string;
    _id?: ObjectId;
    log?: string;
  }
}
