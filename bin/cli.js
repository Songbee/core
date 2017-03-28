#!/usr/bin/env node --harmony-proxies

const TorrentClient = require("../lib");
const Server = require("../lib/server");

process.title = "Songbee Core";
process.on("exit", function (code) {
  if (code === 0) return; // normal exit
  if (code === 130) return; // intentional exit with Control-C

  console.error("Unexpected error!");
  console.error("If you believe this is a bug, open an issue:");
  console.error("");
  console.error("    https://github.com/songbee/core/issues");
  console.error("");
  console.error("Songbee Core version: ", require("../package.json").version);
  console.error("WebTorrent version: ", require("webtorrent/package.json").version);
  console.error("Exit code: ", code);
});


const client = new TorrentClient();
const server = new Server(client);
server.listen(50050);
console.log(server.address());
