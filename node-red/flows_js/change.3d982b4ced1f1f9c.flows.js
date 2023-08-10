const Node = {
  "id": "3d982b4ced1f1f9c",
  "type": "change",
  "z": "6cc161e748b99815",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "transactions",
      "pt": "global",
      "to": "payload.response.transactions",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1250,
  "y": 440,
  "wires": [
    [
      "2db04737efe5487c"
    ]
  ],
  "_order": 54
}

module.exports = Node;