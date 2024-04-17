const Node = {
  "id": "1f0cf3e7517a3a8f",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "Step check",
  "property": "step",
  "propertyType": "flow",
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
  "x": 330,
  "y": 140,
  "wires": [
    [
      "66f7f4915a00da12"
    ],
    [
      "b33873bc5ca0dcfc"
    ],
    [
      "0eb4d70577cb850a"
    ]
  ]
}

module.exports = Node;