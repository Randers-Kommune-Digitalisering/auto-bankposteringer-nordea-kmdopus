const Node = {
  "id": "61676c6c7947def6",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "accountingRules",
      "pt": "global",
      "to": "$globalContext(\"accountingRules\") ~> | $ |\t(\t    $.RuleID = $$.uid ? $$.payload\t) |",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 780,
  "y": 380,
  "wires": [
    [
      "917ce267e21a448a"
    ]
  ]
}

module.exports = Node;