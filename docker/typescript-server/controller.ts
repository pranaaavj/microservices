import { Response, Request } from 'express';

export const getRequest = async (req: Request, res: Response) => {
  if (!req.query.user) {
    return res.status(400).json({ error: 'Missing user' });
  }

  return res.json({ user: req.query.user });
};
