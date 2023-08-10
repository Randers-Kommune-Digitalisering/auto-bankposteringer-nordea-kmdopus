const Node = {
  "id": "3d9af6a4fe22b06b",
  "type": "change",
  "z": "6cc161e748b99815",
  "g": "b23b428a2893858e",
  "name": "Regler i payload",
  "rules": [
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 540,
  "y": 400,
  "wires": [
    [
      "d0ed2805a58e8d63"
    ]
  ],
  "_order": 103
}

module.exports = Node;