const Node = {
  "id": "5e26b79b63c42a9f",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "name": "File name",
  "rules": [
    {
      "t": "set",
      "p": "payload.filedata",
      "pt": "msg",
      "to": "configs.ftp.filepaths.send.fullPath",
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
  "x": 710,
  "y": 320,
  "wires": [
    [
      "e2b88565d20a1a74"
    ]
  ]
}

module.exports = Node;