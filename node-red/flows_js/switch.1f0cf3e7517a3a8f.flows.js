const Node = {
  "id": "1f0cf3e7517a3a8f",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "Step checker",
  "property": "step",
  "propertyType": "flow",
  "rules": [
    {
      "t": "eq",
      "v": "0",
      "vt": "num"
    },
    {
      "t": "eq",
      "v": "1",
      "vt": "num"
    },
    {
      "t": "eq",
      "v": "2",
      "vt": "num"
    },
    {
      "t": "eq",
      "v": "3",
      "vt": "num"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 4,
  "x": 595,
  "y": 120,
  "wires": [
    [
      "7a9c780ed742f3c1"
    ],
    [
      "66f7f4915a00da12"
    ],
    [
      "b33873bc5ca0dcfc"
    ],
    [
      "0eb4d70577cb850a"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;