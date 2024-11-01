const Node = {
  "id": "ae9ec673824528b2",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "Remove id part of each line",
  "rules": [
    {
      "t": "set",
      "p": "filename",
      "pt": "msg",
      "to": "configs.ftp.filepaths.local.fullPath",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 595,
  "y": 220,
  "wires": [
    [
      "320460172b7a9a11"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;