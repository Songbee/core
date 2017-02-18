const express = require("express");

function Server(client) {
  const app = express();

  app.get("/", function (req, res) {
    res.send("This is Songbee Core server v. 0.0.0");
  });

  app.route("/torrents")
    .get(function (req, res) {
      res.send("List torrents");
    })
    .post(function (req, res) {
      res.send("Add a torrent");
    });

  app.route("/torrents/:infoHash")
    .get(function (req, res) {
      res.send("Get info about a torrent");
    })
    .put(function (req, res) {
      res.send("Update something about torrent (?)");
    })
    .delete(function (req, res) {
      res.send("Remove torrent");
    });

  return app;
}
