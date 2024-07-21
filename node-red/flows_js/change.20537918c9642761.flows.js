const Node = {
  "id": "20537918c9642761",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "newrule.id",
      "pt": "msg",
      "to": "payload.insertId",
      "tot": "msg",
      "dc": true
    },
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "$globalContext(\"konteringsregler\") ~> $append(newrule)",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1120,
  "y": 520,
  "wires": [
    [
      "5bf6e3cac11944d7"
    ]
  ]
}

module.exports = Node;