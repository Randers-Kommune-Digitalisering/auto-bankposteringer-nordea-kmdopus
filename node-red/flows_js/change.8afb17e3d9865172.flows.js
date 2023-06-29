const Node = {
  "id": "8afb17e3d9865172",
  "type": "change",
  "z": "9f235917ac3d8025",
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
      "2ba8938b64295b9b"
    ]
  ],
  "_order": 97
}

module.exports = Node;