const Node = {
  "id": "f02a23fc345e7338",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "af45fb910a71600f",
  "name": "minus 5 minutes",
  "rules": [
    {
      "t": "set",
      "p": "accessDuration",
      "pt": "global",
      "to": "$globalContext(\"accessDuration\") - 86400",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 205,
  "y": 740,
  "wires": [
    [
      "3017b668d2a14219"
    ]
  ],
  "l": false
}

module.exports = Node;