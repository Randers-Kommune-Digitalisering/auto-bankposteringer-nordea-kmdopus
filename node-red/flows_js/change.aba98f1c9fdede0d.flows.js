const Node = {
  "id": "aba98f1c9fdede0d",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "Rearrange msg object",
  "rules": [
    {
      "t": "delete",
      "p": "filename",
      "pt": "msg"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
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
      "to": "configs.ftp.filepaths.recieve.fullPath",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 355,
  "y": 120,
  "wires": [
    [
      "94bea6610e2a102b"
    ]
  ],
  "icon": "font-awesome/fa-language",
  "l": false
}

module.exports = Node;