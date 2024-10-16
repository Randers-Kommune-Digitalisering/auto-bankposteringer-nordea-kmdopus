const Node = {
  "id": "dbb0440fe1e81056",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "e2cf63522154167b",
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
  "x": 665,
  "y": 1480,
  "wires": [
    [
      "907046a328b857d3"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;