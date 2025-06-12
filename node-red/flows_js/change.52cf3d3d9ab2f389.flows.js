const Node = {
  "id": "52cf3d3d9ab2f389",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f0b2b6a944eaa19d",
  "name": "set vars",
  "rules": [
    {
      "t": "set",
      "p": "runs.remake",
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
  "x": 695,
  "y": 440,
  "wires": [
    [
      "098a179830625fee"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;