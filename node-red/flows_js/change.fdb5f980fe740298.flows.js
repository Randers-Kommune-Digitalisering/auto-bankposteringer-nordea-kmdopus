const Node = {
  "id": "fdb5f980fe740298",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "8ca141c872ee3048",
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
  "x": 385,
  "y": 160,
  "wires": [
    [
      "cd069fd6c0669353"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;