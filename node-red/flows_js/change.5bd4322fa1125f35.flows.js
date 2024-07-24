const Node = {
  "id": "5bd4322fa1125f35",
  "type": "change",
  "z": "VueExample",
  "g": "5f30159012b7773a",
  "name": "Aktve regler",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$globalContext(\"accountingRules\")[$.Active = true]",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 125,
  "y": 60,
  "wires": [
    [
      "5f89fe8ee31fa66c"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;