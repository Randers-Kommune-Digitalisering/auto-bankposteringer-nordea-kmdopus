const Node = {
  "id": "703ad9de0b11b183",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "f1ccc69d30eff26a",
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
  "x": 355,
  "y": 80,
  "wires": [
    [
      "271dc9ab5f39e420"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;