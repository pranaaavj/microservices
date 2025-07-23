import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'admin',
  brokers: ['localhost:9092'],
});

const admin = kafka.admin();

await admin.connect();

await admin.createTopics({
  topics: [
    {
      topic: 'rider',
      numPartitions: 2,
    },
  ],
});

await admin.disconnect();
