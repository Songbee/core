<h1 align="center" style="border-bottom: none;">
  <img src="https://cdn.rawgit.com/Songbee/assets/master/songbee-core.svg" alt="logo" width="200">
  <br>
  Songbee Core
</h1>

<h4 align="center">A headless torrent client made for <a href="https://songbee.net">Songbee</a></h4>

---

**NB**: This project is stalled. You can use [Confluence] (MPL) instead: it
doesn't depend on Node.js and is maintained more actively. If you just need
a nice HTTP-based torrent client, give [Cloud Torrent] (AGPLv3) a try.

[Confluence]: https://github.com/anacrolix/confluence
[Cloud Torrent]: https://github.com/jpillora/cloud-torrent

Using torrents in your app should be simple! Even if it isn't Node.js. And if
your app is restarted, you'd probably still want to seed the files downloaded
in previous sessions.

To get started, run:

```
$ songbee-core
{ address: '::', family: 'IPv6', port: 50050 }
```

Specifying a port will be available soon. Right now, the API is exposed
at `http://localhost:50050/`.


## API

To add a torrent, `POST` it as an `application/x-bittorrent`:

```
$ http post localhost:50050 @sintel.torrent

{"name": "sintel.mp4", "url": "/6a9759bffd5c0af65319979fb7832189f4f3c35d"}
```


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

When you add a torrent, Songbee Core stores it in a database, so when it starts
again, it'll restore the state and resume seeding (or downloading) the torrents.
**(needs more testing)**
