module.exports = Server;

/*!
 * Modified from https://github.com/feross/webtorrent/blob/master/lib/server.js
 * to support serving multiple torrents in one go.
 *
 * WebTorrent is (c) WebTorrent, LLC, licensed MIT
 */

const http = require("http");
const url = require("url");

const arrayRemove = require("unordered-array-remove");
const mime = require("mime");
const pump = require("pump");
const rangeParser = require("range-parser");
const valuesIn = require("lodash.valuesin");
const typeis = require("type-is");
const getRawBody = require("raw-body");

function sendJSON(res, obj, code=200) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

function sendFile(req, res, file) {
  res.statusCode = 200;
  res.setHeader("Content-Type", mime.lookup(file.name));

  // Support range-requests
  res.setHeader("Accept-Ranges", "bytes");

  // Set name of file (for "Save Page As..." dialog)
  res.setHeader(
    "Content-Disposition",
    "inline; filename*=UTF-8''" + encodeRFC5987(file.name)
  );

  // Support DLNA streaming
  res.setHeader("transferMode.dlna.org", "Streaming");
  res.setHeader(
    "contentFeatures.dlna.org",
    "DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000"
  );

  // `rangeParser` returns an array of ranges, or an error code (number) if
  // there was an error parsing the range.
  var range = rangeParser(file.length, req.headers.range || "");

  if (Array.isArray(range)) {
    res.statusCode = 206; // indicates that range-request was understood

    // no support for multi-range request, just use the first range
    range = range[0];

    res.setHeader(
      "Content-Range",
      "bytes " + range.start + "-" + range.end + "/" + file.length
    )
    res.setHeader("Content-Length", range.end - range.start + 1);
  } else {
    range = null;
    res.setHeader("Content-Length", file.length);
  }

  if (req.method === "HEAD") {
    return res.end();
  }

  pump(file.createReadStream(range), res);
}

function encodeRFC5987(str) {
  // From https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent

  return encodeURIComponent(str)
    // Note that although RFC3986 reserves "!", RFC5987 does not,
    // so we do not need to escape it
    .replace(/['()]/g, escape) // i.e., %27 %28 %29
    .replace(/\*/g, '%2A')
    // The following are not required for percent-encoding per RFC5987,
    // so we can allow for a little better readability over the wire: |`^
    .replace(/%(?:7C|60|5E)/g, unescape)
}

function torrentPromise(torrent) {
  return new Promise((resolve, reject) => {
    if (torrent.ready) {
      resolve(torrent);
    } else {
      torrent.once("ready", resolve);
    }
  });
}

function Server(client, opts) {
  var server = http.createServer(opts);

  var sockets = [];
  var closed = false;

  server.on("connection", onConnection);
  server.on("request", onRequest);

  var _close = server.close;
  server.close = function(cb) {
    closed = true;
    server.removeListener("connection", onConnection);
    server.removeListener("request", onRequest);
    // while (pendingReady.length) {
      // var onReady = pendingReady.pop()
      // torrent.removeListener("ready", onReady)
    // }  TODO: reintroduce this
    client = null;
    _close.call(server, cb);
  }

  server.destroy = function(cb) {
    sockets.forEach(function(socket) {
      socket.destroy();
    });

    // Only call `server.close` if user has not called it already
    if (!cb) cb = function() {};
    if (closed) process.nextTick(cb);
    else server.close(cb);
  }

  function onConnection(socket) {
    socket.setTimeout(36000000);
    sockets.push(socket);
    socket.once("close", function() {
      arrayRemove(sockets, sockets.indexOf(socket));
    });
  }

  function onRequest(req, res) {
    var pathname = url.parse(req.url).pathname;

    if (pathname === "/favicon.ico") {
      return sendJSON(res, {"error": "No favicon :)"}, 404);
    }

    // Allow CORS requests to read responses
    if (req.headers.origin) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    }

    // Prevent browser mime-type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Allow CORS requests to specify arbitrary headers, e.g. "Range",
    // by responding to the OPTIONS preflight request with the specified
    // origin and requested headers.
    if (req.method === "OPTIONS") {
      res.statusCode = 204;  // no content
      res.setHeader("Access-Control-Max-Age", "600");
      res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");

      if (req.headers["access-control-request-headers"]) {
        res.setHeader("Access-Control-Allow-Headers",
                      req.headers["access-control-request-headers"]);
      }
      res.end();
      return;
    }

    if (req.method === "POST") {
      if (typeis(req, ["application/x-bittorrent"])) {
        getRawBody(req, {
          length: req.headers["content-length"],
          limit: "2mb",
        }, function (err, buffer) {
          if (err) {
            return sendJSON(res, {"error": err.type}, err.statusCode);
          }

          client.add(buffer).then((torrent) => {
            sendJSON(res, {
              "name": torrent.name,
              "url": "/" + torrent.infoHash,
            }, 201);
          });
        });
        return;
      } else if (typeis(req, ["application/x-magnet"])) {
        return sendJSON(res, {"error": "Not supported yet"}, 415);
      } else {
        return sendJSON(res, {"error": "Unsupported media type"}, 415);
      }
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJSON(res, {"error": "Method not allowed"}, 405);
    }

    var parts = pathname.replace(/^\/+|\/+$/g, "").split("/");

    // GET /
    if (parts[0] === "") {
      return sendJSON(res, {
        "torrents": valuesIn(client.torrents).map(torrent => ({
          "name": torrent.name,
          "url": "/" + torrent.infoHash,
        })),
      }, 200);
    }

    var infoHash = parts[0];

    if (!client.torrents.hasOwnProperty(infoHash)) {
      return sendJSON(res, {"error": "No such torrent"}, 404);
    }

    var torrent = client.torrents[infoHash];
    torrentPromise(torrent).then(() => {
      // GET /:infoHash
      if (parts.length == 1) {
        return sendJSON(res, {
          "name": torrent.name,
          "files": torrent.files.map((file, i) => ({
            "name": file.name,
            "path": file.path,
            "url": "/" + torrent.infoHash + "/" + i,
            "length": file.length,
          })),
        });
      }

      // GET /:infoHash/:fileIndex

      var index = Number(parts[1]);
      if (Number.isNaN(index) || index >= torrent.files.length) {
        return sendJSON(res, {"error": "Invalid file index"}, 404);
      }

      var file = torrent.files[index];
      sendFile(req, res, file);
    }).catch(err => {
      console.error(err);
      return sendJSON(res, {"error": "Some strange stuff happened"}, 500);
    });
  }

  return server;
}
