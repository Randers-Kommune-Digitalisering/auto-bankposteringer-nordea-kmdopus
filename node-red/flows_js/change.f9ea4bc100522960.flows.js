const Node = {
  "id": "f9ea4bc100522960",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$globalContext(\"konteringsregler\")[id = $$.uid]",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 540,
  "y": 280,
  "wires": [
    [
      "16bbec781e708ac6",
      "61054438f2de6852"
    ]
  ]
}

module.exports = Node;