const Node = {
  "id": "534a9c275b564099",
  "type": "change",
  "z": "88c6307a5ee1dd81",
  "g": "0fc5db670402470f",
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
  "x": 455,
  "y": 220,
  "wires": [
    [
      "f8956afdf1e90c7a"
    ]
  ],
  "icon": "font-awesome/fa-language",
  "l": false
}

module.exports = Node;