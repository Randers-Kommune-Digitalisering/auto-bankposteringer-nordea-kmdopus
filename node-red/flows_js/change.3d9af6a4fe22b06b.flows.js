const Node = {
  "id": "3d9af6a4fe22b06b",
  "type": "change",
  "z": "6cc161e748b99815",
  "g": "b23b428a2893858e",
  "name": "Konteringsregler til global obj",
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
  "x": 360,
  "y": 600,
  "wires": [
    [
      "d0ed2805a58e8d63"
    ]
  ],
  "_order": 64
}

module.exports = Node;