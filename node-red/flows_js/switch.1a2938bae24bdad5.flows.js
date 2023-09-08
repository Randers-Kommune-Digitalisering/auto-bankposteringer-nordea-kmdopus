const Node = {
  "id": "1a2938bae24bdad5",
  "type": "switch",
  "z": "6cc161e748b99815",
  "g": "3bdd50ac31e6a0b9",
  "name": "",
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
    },
    {
      "t": "eq",
      "v": "4",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 4,
  "x": 290,
  "y": 200,
  "wires": [
    [
      "341c3d7d097dcfd4"
    ],
    [
      "ecb6baa197d15081"
    ],
    [
      "0bb7426eb32a2349"
    ],
    [
      "03687c19ec4e3b9e"
    ]
  ],
  "_order": 70
}

module.exports = Node;