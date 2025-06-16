import express from 'express';
import { getRequest } from './controller';
const app = express();
app.get('/', getRequest);
app.listen(3000, () => {
    console.log('Server started');
});
