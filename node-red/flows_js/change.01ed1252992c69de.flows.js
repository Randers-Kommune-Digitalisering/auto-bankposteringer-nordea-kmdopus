const Node = {
  "id": "01ed1252992c69de",
  "type": "change",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Activate label",
  "rules": [
    {
      "t": "set",
      "p": "ui_update.label",
      "pt": "msg",
      "to": "Aktivér",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "altPayload",
      "pt": "flow",
      "to": "aktivering",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 965,
  "y": 340,
  "wires": [
    [
      "427acc4eb00f5802"
    ]
  ],
  "l": false
}

module.exports = Node;