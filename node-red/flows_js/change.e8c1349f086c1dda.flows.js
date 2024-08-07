const Node = {
  "id": "e8c1349f086c1dda",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "132962a7a75a51ea",
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
  "x": 865,
  "y": 80,
  "wires": [
    [
      "77827e1ac1604d6b"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;