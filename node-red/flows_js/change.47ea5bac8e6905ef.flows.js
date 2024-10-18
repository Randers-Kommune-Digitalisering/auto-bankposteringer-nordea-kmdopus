const Node = {
  "id": "47ea5bac8e6905ef",
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
      "p": "updatedFromRule",
      "pt": "global",
      "to": "$globalContext(\"accountingRules\")[RuleID = $$.uid]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "updatedToRule",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 195,
  "y": 500,
  "wires": [
    [
      "40fc13199736e30e"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;