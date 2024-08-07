const Node = {
  "id": "898f1234aebf1a9e",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "702997f9bea3aa27",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$globalContext(\"accountingRules\")[RuleID = $$.uid]",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 355,
  "y": 180,
  "wires": [
    [
      "db3b78114328b2b5",
      "38fc8f3864b3d96a"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;