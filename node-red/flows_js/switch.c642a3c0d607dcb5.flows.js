const Node = {
  "id": "c642a3c0d607dcb5",
  "type": "switch",
  "z": "31641b084096a0df",
  "g": "4a6dde7358821073",
  "name": "",
  "property": "step",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "2",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "3",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "5",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 950,
  "y": 220,
  "wires": [
    [
      "6ec3e5cc83a5c779"
    ],
    [
      "5f0aa7613b79ec87"
    ],
    [
      "6292b31cc3566140"
    ]
  ],
  "_order": 40
}

module.exports = Node;