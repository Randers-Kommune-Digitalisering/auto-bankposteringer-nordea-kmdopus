const Node = {
  "id": "afb3f33566f5fa50",
  "type": "change",
  "z": "0bc16db685bd2e6a",
  "name": "Set response",
  "rules": [
    {
      "t": "set",
      "p": "payload.response",
      "pt": "msg",
      "to": "data modtaget",
      "tot": "str",
      "dc": true
    },
    {
      "t": "delete",
      "p": "payload.data",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 870,
  "y": 460,
  "wires": [
    [
      "160b4ec1b061d426"
    ]
  ],
  "_order": 75
}

module.exports = Node;