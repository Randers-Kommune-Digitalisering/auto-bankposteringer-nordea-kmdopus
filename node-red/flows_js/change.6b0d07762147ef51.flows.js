const Node = {
  "id": "6b0d07762147ef51",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "9a4bf534fe58df76",
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
  "x": 545,
  "y": 100,
  "wires": [
    [
      "0b574553c9340fc6"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;