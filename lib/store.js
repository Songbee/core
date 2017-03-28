const fs = require("fs-extra");
const throttle = require("lodash.throttle");

module.exports = JSONStore;

function JSONStore(path) {
  const target = {};

  if (fs.existsSync(path)) {
    Object.assign(target, fs.readJsonSync(path));
  } else {
    fs.outputJsonSync(path, {});
  }

  const writeOut = throttle(function() {
    fs.outputJsonSync(path, target);
  }, 500);

  return new Proxy(target, {
    set: function(target, prop, value, receiver) {
      target[prop] = value;
      writeOut();
      // fs.outputJsonSync(path, target);
      return true;
    }
  });
}
