import express from 'express';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

const app = express();

const MONGO_URI = process.env.MONGO_URI as string;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Successfull'))
  .catch((err) => console.log(err));

app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

app.listen(3000, () => console.log('Server has started'));
