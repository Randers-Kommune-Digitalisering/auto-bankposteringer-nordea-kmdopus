const Node = {
  "id": "9c221a6279c369bf",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f0b2b6a944eaa19d",
  "name": "set vars",
  "rules": [
    {
      "t": "set",
      "p": "runs.restart",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    },
    {
      "t": "set",
      "p": "runs.originDate",
      "pt": "global",
      "to": "req.params.uid",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "runs.originUid",
      "pt": "global",
      "to": "req.query.id",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 685,
  "y": 560,
  "wires": [
    [
      "693dd74872b78c66",
      "f6a3452a9f8c7e6e"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;