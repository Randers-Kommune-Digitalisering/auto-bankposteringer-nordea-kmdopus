const Node = {
  "id": "a4fc373969e73ae0",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "977c991daa71653f",
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
      "p": "newrule",
      "pt": "msg",
      "to": "payload",
      "tot": "msg",
      "dc": true
    },
    {
      "t": "set",
      "p": "ruleId",
      "pt": "msg",
      "to": "payload.RuleID",
      "tot": "msg",
      "dc": true
    },
    {
      "t": "set",
      "p": "newrule.RuleID",
      "pt": "msg",
      "to": "ruleId",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 505,
  "y": 400,
  "wires": [
    [
      "14a5089d7e6463aa"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;