import { client } from './client.js';

await client.set('name', 'pranav');

const value = await client.get('name');

console.log(value);
