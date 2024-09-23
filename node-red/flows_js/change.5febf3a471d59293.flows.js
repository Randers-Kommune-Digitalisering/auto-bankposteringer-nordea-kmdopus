const Node = {
  "id": "5febf3a471d59293",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "0b5190b6f576f668",
  "name": "Aktve regler",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "(\t    type = \"aktiv\" ?\t        $globalContext(\"accountingRules\")[ActiveBool = true and ExceptionBool = false]\t    :\t    type = \"inaktiv\" ?\t        $globalContext(\"accountingRules\")[ActiveBool = false and ExceptionBool = false]\t    :\t    type = \"undtagelse\" ?\t        $globalContext(\"accountingRules\")[ExceptionBool = true]\t)\t",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 185,
  "y": 180,
  "wires": [
    [
      "55045eaac04f55a8"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;