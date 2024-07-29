const Node = {
  "id": "7984e9c043157ab6",
  "type": "change",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Deactivate label",
  "rules": [
    {
      "t": "set",
      "p": "ui_update.label",
      "pt": "msg",
      "to": "Deaktivér",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "altPayload",
      "pt": "flow",
      "to": "deaktivering",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 965,
  "y": 300,
  "wires": [
    [
      "427acc4eb00f5802"
    ]
  ],
  "l": false
}

module.exports = Node;