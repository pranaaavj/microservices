import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send({ message: 'hello there' });
});

app.listen(3000, (err) => {
  if (err) console.log('Error occurred');

  console.log('Server started');
});
