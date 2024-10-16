const Node = {
  "id": "0b5d02480ab02e58",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "ea1bf65dfedc00a0",
  "name": "Set uid to origin uid",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "originalUid",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 215,
  "y": 1240,
  "wires": [
    [
      "c40228fc31a4eb75"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;