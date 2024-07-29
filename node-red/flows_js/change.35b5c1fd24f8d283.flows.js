const Node = {
  "id": "35b5c1fd24f8d283",
  "type": "change",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Confirm deactivation label",
  "rules": [
    {
      "t": "set",
      "p": "ui_update.label",
      "pt": "msg",
      "to": "\"Bekræft \" & $flowContext(\"altPayload\")",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "ruleAction",
      "pt": "flow",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1235,
  "y": 360,
  "wires": [
    [
      "bef2131d8ffb8043"
    ]
  ],
  "l": false
}

module.exports = Node;