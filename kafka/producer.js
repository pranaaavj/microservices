import readline from 'readline';
import { kafka } from './admin.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const producer = kafka.producer();
await producer.connect();

rl.prompt('> ');
rl.on('line', async (input) => {
  const topic = input.split(' ')[1];

  await producer.send({
    topic: 'rider',
    messages: [{ value: input, partition: topic === 'KERALA' ? 0 : 1 }],
  });
}).on('close', async () => await producer.disconnect());
