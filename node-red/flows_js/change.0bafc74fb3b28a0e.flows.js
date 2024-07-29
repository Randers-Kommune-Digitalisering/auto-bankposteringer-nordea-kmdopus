const Node = {
  "id": "0bafc74fb3b28a0e",
  "type": "change",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Confirm deletion label",
  "rules": [
    {
      "t": "set",
      "p": "ui_update.label",
      "pt": "msg",
      "to": "Bekræft sletning",
      "tot": "str"
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
  "y": 340,
  "wires": [
    [
      "bef2131d8ffb8043"
    ]
  ],
  "l": false
}

module.exports = Node;