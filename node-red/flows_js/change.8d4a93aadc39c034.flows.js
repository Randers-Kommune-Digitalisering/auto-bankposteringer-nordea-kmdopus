const Node = {
  "id": "8d4a93aadc39c034",
  "type": "change",
  "z": "VueExample",
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
  "x": 390,
  "y": 520,
  "wires": [
    [
      "587bfbd1318b9cbf"
    ]
  ]
}

module.exports = Node;