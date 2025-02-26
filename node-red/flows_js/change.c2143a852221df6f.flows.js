const Node = {
  "id": "c2143a852221df6f",
  "type": "change",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "originDate",
      "pt": "msg",
      "to": "payload[0].originDate",
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
  "x": 645,
  "y": 360,
  "wires": [
    [
      "92d167152b47a4bc"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;