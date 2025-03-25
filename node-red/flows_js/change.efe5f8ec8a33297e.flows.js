const Node = {
  "id": "efe5f8ec8a33297e",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "Set FTP filename",
  "rules": [
    {
      "t": "set",
      "p": "configs.ftp.filepaths.send.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.send.rootFolder & filename",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.recieve.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.recieve.rootFolder & filename",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 255,
  "y": 120,
  "wires": [
    [
      "5fa589dcdd8d1f73"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;