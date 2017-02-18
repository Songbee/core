const url = require("url");
const path = require("path");

const isEqual = require("lodash.isequal");
// const envPaths = require("env-paths");
const WebTorrent = require("./promisified-webtorrent");
const parseTorrent = require("parse-torrent");
const Server = require("./server");


// const CACHE_PATH = envPaths("Songbee", { suffix: "" }).cache;
const CACHE_PATH = "./cache";


class TorrentClient {
  constructor(port=undefined) {
    this.cachePath = CACHE_PATH;

    this.webtorrent = new WebTorrent();
    this.server = new Server(this);
    this.server.listen(port || 50050);

    this.torrents = {};
    this.torrentState = {};
  }

  add(torrentId, options={}) {
    let parsedTorrent = parseTorrent(torrentId);

    if (this.torrents.hasOwnProperty(parsedTorrent.infoHash)) {
      // WebTorrent doesn't generally appreciate duplicate additions.
      // We instead return the already existing torrent silently.
      return this.releases[parsedTorrent.infoHash];
    }

    return this.webtorrent.add(parsedTorrent, Object.assign({
      path: path.join(this.cachePath, parsedTorrent.infoHash),
      // defaults go here
    }, options)).then((torrent) => {
      this.torrents[torrent.infoHash] = torrent;
      this.torrentState[torrent.infoHash] = {
        parsedTorrent: parsedTorrent,
        path: torrent.path,
      };
      return torrent;
    });
  }

  remove(infoHash, purge=false) {
    if (purge) {
      // rimraf(this.torrentState[infoHash].path)
    }

    delete this.torrents[infoHash];
    delete this.torrentState[infoHash];
  }
}

module.exports = TorrentClient;
