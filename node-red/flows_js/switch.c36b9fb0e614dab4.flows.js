const Node = {
  "id": "c36b9fb0e614dab4",
  "type": "switch",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "hovedkonto?",
  "property": "pointerAccount",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "debitorkonto",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "hovedkonto",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 575,
  "y": 60,
  "wires": [
    [
      "92e6bca0b7814dbb"
    ],
    [
      "92e6bca0b7814dbb",
      "f4017223fa913e7c"
    ]
  ],
  "l": false,
  "_order": 221
}

module.exports = Node;