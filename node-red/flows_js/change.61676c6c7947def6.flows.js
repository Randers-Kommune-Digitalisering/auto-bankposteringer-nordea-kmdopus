const Node = {
  "id": "61676c6c7947def6",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "$globalContext(\"konteringsregler\") ~> | $ |\t(\t    $.id = $$.uid ? $$.payload\t) |",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 760,
  "y": 380,
  "wires": [
    [
      "8bef4fda34efd8ed"
    ]
  ]
}

module.exports = Node;