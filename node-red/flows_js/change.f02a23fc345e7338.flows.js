const Node = {
  "id": "f02a23fc345e7338",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "af45fb910a71600f",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "accessDuration",
      "pt": "flow",
      "to": "$flowContext(\"accessDuration\") - 1440",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 215,
  "y": 720,
  "wires": [
    []
  ],
  "l": false
}

module.exports = Node;