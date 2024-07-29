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
      "to": "(\t    type = \"aktiv\" ?\t        $globalContext(\"accountingRules\")[Active = true and Exception = false]\t    :\t    type = \"inaktiv\" ?\t        $globalContext(\"accountingRules\")[Active = false and Exception = false]\t    :\t    type = \"undtagelse\" ?\t        $globalContext(\"accountingRules\")[Exception = true]\t    :\t        $globalContext(\"accountingRules\")[Exception = false]\t\t)\t",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 205,
  "y": 200,
  "wires": [
    [
      "5f89fe8ee31fa66c",
      "d2a56497e82e15d4"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;