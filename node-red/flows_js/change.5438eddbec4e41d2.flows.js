const Node = {
  "id": "5438eddbec4e41d2",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "07bb69b48ccd0bcd",
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
  "x": 545,
  "y": 280,
  "wires": [
    [
      "e194758a8f4fedf4"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;