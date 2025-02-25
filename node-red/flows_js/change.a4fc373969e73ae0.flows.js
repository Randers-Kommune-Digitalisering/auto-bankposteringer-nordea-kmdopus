const Node = {
  "id": "a4fc373969e73ae0",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "4169783d237ba908",
  "name": "Sæt værdier",
  "rules": [
    {
      "t": "set",
      "p": "payload.RuleID",
      "pt": "msg",
      "to": "( ($globalContext(\"accountingRules\")).RuleID ~> $max() ) + 1",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "newRule",
      "pt": "global",
      "to": "payload",
      "tot": "msg",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 195,
  "y": 480,
  "wires": [
    [
      "8c6a11b0793c4d75"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;