const Node = {
  "id": "9b26ba95b89a2750",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "g": "e5fafc3bcb2d4365",
  "name": "Regler til msg",
  "rules": [
    {
      "t": "set",
      "p": "payload.rules",
      "pt": "msg",
      "to": "konteringsregler",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 780,
  "y": 60,
  "wires": [
    [
      "14d9ba41e0d56ad1"
    ]
  ],
  "_order": 227
}

module.exports = Node;