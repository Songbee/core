const fs = require("fs-extra");
const url = require("url");
const path = require("path");

const isEqual = require("lodash.isequal");
const envPaths = require("env-paths");
const valuesIn = require("lodash.valuesin");
const WebTorrent = require("./promisified-webtorrent");
const parseTorrent = require("parse-torrent");
const JSONStore = require("./store");
const Server = require("./server");

const DEFAULT_PATHS = envPaths("SongbeeCore", { suffix: "" });


class TorrentClient {
  constructor(options={}) {
    this.databasePath = options.databasePath ||
                        path.join(DEFAULT_PATHS.data, "beecoredb.json");
    this.cachePath = options.cachePath || DEFAULT_PATHS.cache;

    console.log(`databasePath: ${this.databasePath}`);

    this.webtorrent = new WebTorrent();

    this.torrents = {};
    this.torrentState = new JSONStore(this.databasePath);
    valuesIn(this.torrentState).map((o) => {
      this.add(o.parsedTorrent, o.options);
    });
  }

  add(torrentId, options={}) {
    let parsedTorrent = parseTorrent(torrentId);

    if (this.torrents.hasOwnProperty(parsedTorrent.infoHash)) {
      // WebTorrent doesn't generally appreciate duplicate additions.
      // We instead return the already existing torrent silently.
      return this.torrents[parsedTorrent.infoHash];
    }

    return this.webtorrent.add(parsedTorrent, Object.assign({
      path: path.join(this.cachePath, parsedTorrent.infoHash),
      // defaults go here
    }, options)).then((torrent) => {
      this.torrents[torrent.infoHash] = torrent;
      this.torrentState[torrent.infoHash] = {
        parsedTorrent: parsedTorrent,
        options: options,
      };

      return torrent;
    });
  }

  remove(infoHash, purge=false) {
    if (purge) {
      // rimraf(this.torrentState[infoHash].path);
      console.log("(not actually) deleting", this.torrentState[infoHash].path);
    }

    delete this.torrents[infoHash];
    delete this.torrentState[infoHash];
  }
}

module.exports = TorrentClient;
