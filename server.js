const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT) || 3001;
const root = __dirname;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

http
  .createServer((request, response) => {
    const requestPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
    const filePath = path.join(root, decodeURIComponent(requestPath));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "text/plain" });
      response.end(data);
    });
  })
  .listen(port, () => {
    console.log(`LifeVault running at http://localhost:${port}`);
  });
