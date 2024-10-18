const Node = {
  "id": "f3f1bf04db0a3145",
  "type": "change",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "dato",
      "pt": "msg",
      "to": "payload[0].dato",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "originalUid",
      "pt": "global",
      "to": "uid",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 305,
  "y": 1000,
  "wires": [
    [
      "459e7b1dcd1a5b28",
      "b2e277770bc19a02"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;