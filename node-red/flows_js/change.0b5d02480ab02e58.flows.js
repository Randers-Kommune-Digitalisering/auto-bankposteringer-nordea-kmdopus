const Node = {
  "id": "0b5d02480ab02e58",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "ea1bf65dfedc00a0",
  "name": "Set uid to origin uid",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "runs.originUid",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 535,
  "y": 520,
  "wires": [
    [
      "0c3e96f69a239147"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;