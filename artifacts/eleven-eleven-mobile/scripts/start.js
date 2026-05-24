#!/usr/bin/env node
/**
 * Startup wrapper for Expo Metro in Replit.
 *
 * Opens port 3001 IMMEDIATELY with an HTTP/WS reverse proxy so the platform's
 * port-detection health-check succeeds right away, then starts Metro on port
 * 3002.  All traffic on :3001 is forwarded to Metro at :3002.
 */
const http = require("http");
const net = require("net");
const { spawn } = require("child_process");

const PROXY_PORT = parseInt(process.env.PORT || "3001", 10);
const METRO_PORT = PROXY_PORT + 1; // 3002
const HOST = "0.0.0.0"; // Must bind to all interfaces so the platform can detect the port

// ── HTTP reverse proxy ────────────────────────────────────────────────────────
function proxyRequest(req, res) {
  const opts = {
    hostname: HOST,
    port: METRO_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxy.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Metro not ready yet");
    }
  });
  req.pipe(proxy, { end: true });
}

// ── WebSocket / HTTP upgrade proxy ───────────────────────────────────────────
function proxyUpgrade(req, clientSocket, head) {
  const serverSocket = net.connect(METRO_PORT, HOST, () => {
    serverSocket.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(req.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n") +
        "\r\n\r\n"
    );
    if (head && head.length) serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });
  serverSocket.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => serverSocket.destroy());
}

const server = http.createServer(proxyRequest);
server.on("upgrade", proxyUpgrade);

server.listen(PROXY_PORT, HOST, () => {
  const env = {
    ...process.env,
    EXPO_PACKAGER_PROXY_URL: `https://${
      process.env.REPLIT_EXPO_DEV_DOMAIN || "localhost"
    }`,
    EXPO_PUBLIC_DOMAIN: process.env.REPLIT_DEV_DOMAIN || "localhost",
    EXPO_PUBLIC_REPL_ID: process.env.REPL_ID || "",
    REACT_NATIVE_PACKAGER_HOSTNAME:
      process.env.REPLIT_DEV_DOMAIN || "localhost",
  };

  const metro = spawn(
    "pnpm",
    ["exec", "expo", "start", "--localhost", "--port", String(METRO_PORT)],
    { env, stdio: "inherit" }
  );

  metro.on("exit", (code) => process.exit(code ?? 0));
  metro.on("error", (err) => {
    process.stderr.write(err.message + "\n");
    process.exit(1);
  });

  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) {
    process.on(sig, () => {
      metro.kill(sig);
      server.close();
    });
  }
});

server.on("error", (err) => {
  process.stderr.write(`Proxy error: ${err.message}\n`);
  process.exit(1);
});
