const Node = {
  "id": "1bc17ff1ec8c9a83",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f0b2b6a944eaa19d",
  "name": "set vars",
  "rules": [
    {
      "t": "set",
      "p": "date",
      "pt": "msg",
      "to": "req.params.uid",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 685,
  "y": 480,
  "wires": [
    [
      "c8792f0c618ee33d"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;