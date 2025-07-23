import { kafka } from './admin.js';

const group = process.argv[2];

const consumer = kafka.consumer({ groupId: group });

await consumer.connect();
await consumer.subscribe({ topic: 'rider', fromBeginning: true });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      partition,
      value: message.value.toString(),
    });
  },
});
