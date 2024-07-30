const Node = {
  "id": "20537918c9642761",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "accountingRules",
      "pt": "global",
      "to": "$globalContext(\"accountingRules\") ~> $append(newrule)",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1060,
  "y": 520,
  "wires": [
    [
      "5c0527c5b98cacba"
    ]
  ]
}

module.exports = Node;