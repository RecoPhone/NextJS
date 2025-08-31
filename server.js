import next from 'next';
import express from 'express';

const dev = false; 
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

await app.prepare();
const server = express();

server.all('*', (req, res) => handle(req, res));

server.listen(port, '0.0.0.0', () => {
  console.log(`RecoPhone running on ${port}`);
});
