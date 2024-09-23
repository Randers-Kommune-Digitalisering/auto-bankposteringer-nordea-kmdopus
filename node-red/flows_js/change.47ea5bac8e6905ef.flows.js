const Node = {
  "id": "47ea5bac8e6905ef",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "e3a1fa8058d9a961",
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
      "p": "updatedFromRule",
      "pt": "flow",
      "to": "$globalContext(\"accountingRules\")[RuleID = $$.uid]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "updatedToRule",
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
  "x": 135,
  "y": 380,
  "wires": [
    [
      "6907248a9472ae39"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;