const Node = {
  "id": "90c9d21948cf0896",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "20a8bc261e47e665",
  "name": "File name",
  "rules": [
    {
      "t": "set",
      "p": "payload.filedata",
      "pt": "msg",
      "to": "configs.ftp.filepaths.recieve.fullPath",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.filename",
      "pt": "msg",
      "to": "filename",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 630,
  "y": 360,
  "wires": [
    [
      "e40a1c9dc4e81c3f"
    ]
  ]
}

module.exports = Node;