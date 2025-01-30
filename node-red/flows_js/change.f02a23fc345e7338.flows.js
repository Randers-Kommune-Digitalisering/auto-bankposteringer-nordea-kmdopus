const Node = {
  "id": "f02a23fc345e7338",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "af45fb910a71600f",
  "name": "minus 5 minutes",
  "rules": [
    {
      "t": "set",
      "p": "accessDuration",
      "pt": "global",
      "to": "$globalContext(\"accessDuration\") - 300",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 215,
  "y": 900,
  "wires": [
    []
  ],
  "l": false
}

module.exports = Node;