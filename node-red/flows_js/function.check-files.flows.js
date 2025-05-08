const Node = {
  "id": "check-files",
  "type": "function",
  "z": "30ea9c666c3d34a6",
  "g": "e213a029bb7d65e7",
  "name": "Filter Old Files",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "fs",
      "module": "fs"
    },
    {
      "var": "path",
      "module": "path"
    }
  ],
  "x": 325,
  "y": 1100,
  "wires": [
    [
      "delete-files"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, fs, path) {
  // Beregn datoen for 90 dage siden
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  // Filtrer filer med birthtime ældre end cutoffDate
  const oldFiles = msg.files.filter(file => {
      const birthtime = new Date(file.birthtime);
      return birthtime < cutoffDate;
  }).map(file => file.filename);
  
  msg.files = oldFiles;
  msg.deletedFiles = oldFiles;
  
  return msg;
}

module.exports = Node;