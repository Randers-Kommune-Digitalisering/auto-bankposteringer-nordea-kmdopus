const Node = {
  "id": "bdb170c2777b9167",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "a40dda636245513b",
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
  "x": 245,
  "y": 420,
  "wires": [
    [
      "1051bec61b03894f"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;