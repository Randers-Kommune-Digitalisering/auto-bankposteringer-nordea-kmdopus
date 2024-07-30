const Node = {
  "id": "094955872374a0cf",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "accountingRules",
      "pt": "global",
      "to": "$globalContext(\"accountingRules\")[$.RuleID != $$.uid]",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 780,
  "y": 420,
  "wires": [
    [
      "f77ebcca1da1b246"
    ]
  ]
}

module.exports = Node;