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
      "to": "type = \"aktiv\" ?\t    $globalContext(\"masterData\").rules[activeBool = true and exceptionBool = false and tempBool = false] :\ttype = \"inaktiv\" ?\t    $globalContext(\"masterData\").rules[activeBool = false and exceptionBool = false] :\ttype = \"undtagelse\" ?\t    $globalContext(\"masterData\").rules[exceptionBool = true] :\ttype = \"engangsregel\" ?\t    $globalContext(\"masterData\").rules[tempBool = true] :\t{}\t",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 745,
  "y": 60,
  "wires": [
    [
      "83d4326f88df7a48"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;