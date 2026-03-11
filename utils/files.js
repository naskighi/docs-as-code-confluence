const fs = require("fs");
const path = require("path");

const readdirSync = (p, a = []) => {
  if (fs.statSync(p).isDirectory())
    fs.readdirSync(p).map((f) => {
      readdirSync(a[a.push(path.join(p, f)) - 1], a);
    });
  return a;
};

const filesStructure = (root) => {
  const normalizedRoot = path.normalize(root);

  return readdirSync(root)
    .filter((f) => {
      return f.endsWith(".md");
    })
    .map((f) => {
      const relativeToRoot = path.relative(normalizedRoot, path.normalize(f));
      return relativeToRoot.split(path.sep);
    });
};

module.exports = filesStructure;
