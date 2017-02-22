<h1 align="center" style="border-bottom: none;">
  <img src="https://gitcdn.xyz/repo/Songbee/assets/master/songbee-core.svg" alt="logo" width="200">
  <br>
  Songbee Core
</h1>

<h4 align="center">A headless torrent client for <a href="http://songbee.net">Songbee</a></h4>

---

Using torrents in your app should be simple! Even if it isn't Node.js. And if
your app is restarted, you'd probably still want to seed the files downloaded
in previous sessions.

~~To get started, run:~~ **Work in progress**

```
$ songbee-core -p 50050
{ address: '::', family: 'IPv6', port: 50050 }
```


## API

To add a torrent, `POST /` a `multipart/form-data` request:

- Required:
  - `torrent` — torrent file
  - `magnet` — a magnet link
- Optional:
  - `path` — where to save files, default is `path.join(cachePath, infoHash)`


To retrieve a list of torrents, `GET /`:

```json
{
  "torrents": [
    {"name": "sintel.mp4", "url": "/6a9759bffd5c0af65319979fb7832189f4f3c35d"}
  ]
}
```

To get info about a torrent, `GET /<infoHash>`:

```json
{
  "name": "sintel.mp4",
  "files": [{
    "name": "sintel.mp4",
    "path": "sintel.mp4",
    "url": "/6a9759bffd5c0af65319979fb7832189f4f3c35d/0",
    "length": 129241752
  }]
}
```

To stream a file, `GET /<infoHash>/<fileNo>`. That's it!

~~When you add a torrent, Songbee Core stores it in a database, so when it starts
again, it'll restore the state and resume seeding (or downloading) the torrents.~~
**Work in progress!**
