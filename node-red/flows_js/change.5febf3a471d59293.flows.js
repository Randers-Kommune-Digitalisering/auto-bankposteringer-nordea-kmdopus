const Node = {
  "id": "5febf3a471d59293",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "4169783d237ba908",
  "name": "Switch on type",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "(\t    type = \"aktiv\" ?\t        $globalContext(\"masterData\").rules[ActiveBool = true and ExceptionBool = false]\t    :\t    type = \"inaktiv\" ?\t        $globalContext(\"masterData\").rules[ActiveBool = false and ExceptionBool = false]\t    :\t    type = \"undtagelse\" ?\t        $globalContext(\"masterData\").rules[ExceptionBool = true] : {}\t)\t",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 245,
  "y": 320,
  "wires": [
    [
      "83d4326f88df7a48"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;