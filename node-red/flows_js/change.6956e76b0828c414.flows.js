const Node = {
  "id": "6956e76b0828c414",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "1ab12c0299de8032",
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
      "pt": "flow",
      "to": "$globalContext(\"accountingRules\")[RuleID = $$.uid]",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 105,
  "y": 720,
  "wires": [
    [
      "1e7e9b438dad9865"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;