const Node = {
  "id": "check-folder",
  "type": "inject",
  "z": "30ea9c666c3d34a6",
  "g": "e213a029bb7d65e7",
  "name": "",
  "props": [
    {
      "p": "path",
      "v": "configs.ftp.filepaths.send.rootFolder",
      "vt": "global"
    }
  ],
  "repeat": "86400",
  "crontab": "",
  "once": true,
  "onceDelay": "5",
  "topic": "",
  "x": 75,
  "y": 1120,
  "wires": [
    [
      "read-folder"
    ]
  ],
  "icon": "font-awesome/fa-repeat",
  "l": false
}

module.exports = Node;