const Node = {
  "id": "6956e76b0828c414",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "4169783d237ba908",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "req.params.uid ~> $number()",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "deletedRule",
      "pt": "global",
      "to": "$globalContext(\"accountingRules\")[RuleID = $$.uid]",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 195,
  "y": 540,
  "wires": [
    [
      "ed381bc21f3c1605"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;