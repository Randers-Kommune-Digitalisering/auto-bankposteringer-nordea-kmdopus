const Node = {
  "id": "check-folder",
  "type": "inject",
  "z": "30ea9c666c3d34a6",
  "g": "e213a029bb7d65e7",
  "name": "",
  "props": [
    {
      "p": "path",
      "v": "/data/output/",
      "vt": "str"
    }
  ],
  "repeat": "86400",
  "crontab": "",
  "once": true,
  "onceDelay": 0.1,
  "topic": "",
  "x": 75,
  "y": 1100,
  "wires": [
    [
      "read-folder"
    ]
  ],
  "icon": "font-awesome/fa-repeat",
  "l": false
}

module.exports = Node;