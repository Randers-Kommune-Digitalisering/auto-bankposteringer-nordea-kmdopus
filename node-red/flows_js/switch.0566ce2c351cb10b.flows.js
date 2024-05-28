const Node = {
  "id": "0566ce2c351cb10b",
  "type": "switch",
  "z": "73d7d240a587aa11",
  "g": "c12202788c8f2d66",
  "name": "Is SELECT?",
  "property": "sql",
  "propertyType": "msg",
  "rules": [
    {
      "t": "regex",
      "v": "^SELECT\\s+.*\\s+FROM",
      "vt": "str",
      "case": true
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 470,
  "y": 220,
  "wires": [
    [],
    [
      "5e4582c75c1c53ac"
    ]
  ]
}

module.exports = Node;