const Node = {
  "id": "90ca122283f050f2",
  "type": "switch",
  "z": "0b526691b09a2646",
  "g": "f51cc7b4f0bee577",
  "name": "Steps",
  "property": "step",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "1",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "2",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "3",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 910,
  "y": 140,
  "wires": [
    [
      "ec63acebea4c6d96"
    ],
    [
      "6b7d7bfa488dc986"
    ],
    [
      "6f5d7cef733eca4d"
    ]
  ],
  "_order": 135
}

module.exports = Node;