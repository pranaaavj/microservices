import express from 'express';
import { getRequest } from './controller.js';

const app = express();
app.get('/', getRequest);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log('Server started');
});
