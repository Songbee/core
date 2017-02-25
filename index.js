const fs = require("fs-extra");
const url = require("url");
const path = require("path");

const isEqual = require("lodash.isequal");
const envPaths = require("env-paths");
const valuesIn = require("lodash.valuesin");
const WebTorrent = require("./promisified-webtorrent");
const parseTorrent = require("parse-torrent");
const Server = require("./server");

const DEFAULT_PATHS = envPaths("SongbeeCore", { suffix: "" });


class TorrentClient {
  constructor(options={}) {
    this.databasePath = options.databasePath ||
                        path.join(DEFAULT_PATHS.data, "beecoredb.json");
    this.cachePath = options.cachePath || DEFAULT_PATHS.cache;

    console.log(`databasePath: ${this.databasePath}`);

    this.webtorrent = new WebTorrent();
    this.server = new Server(this);
    this.server.listen(options.port || 50050);

    this.torrents = {};
    this.torrentState = {};

    if (fs.existsSync(this.databasePath)) {
      fs.readJson(this.databasePath, (err, db) => {
        valuesIn(db.torrentState).map((o) => {
          this.add(o.parsedTorrent, options);
        });
        Object.assign(this.torrentState, db.torrentState);
      });
    } else {
      fs.outputJSONSync(this.databasePath, {
        v: 0,
        torrentState: this.torrentState,
      });
    }
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

      fs.outputJSON(this.databasePath, {
        v: 0,
        torrentState: this.torrentState,
      }, err => {
        if (err) console.warn(err);
      });

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
