const MAGNET = "magnet:?xt=urn:btih:NKLVTP75LQFPMUYZS6P3PAZBRH2PHQ25&dn=sintel.mp4&tr=udp%3a%2f%2ftracker.openbittorrent.com%3a&tr=udp%3a%2f%2ftracker.internetwarriors.net%3a1337&tr=udp%3a%2f%2ftracker.leechers-paradise.org%3a6969&tr=udp%3a%2f%2ftracker.coppersurfer.tk%3a6969&tr=udp%3a%2f%2fexodus.desync.com%3a6969&tr=wss%3a%2f%2ftracker.openwebtorrent.com&tr=wss%3a%2f%2ftracker.btorrent.xyz";
const TC = require(".");
const tc = new TC();
console.log(tc.server.address());
// tc.add(MAGNET).then(() => {
//   console.log("READY!");
// });
