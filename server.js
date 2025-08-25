const next = require("next");
const http = require("http");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Next.js running on port ${port} (${dev ? "dev" : "prod"})`);
  });
});
