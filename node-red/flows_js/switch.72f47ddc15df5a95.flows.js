const Node = {
  "id": "72f47ddc15df5a95",
  "type": "switch",
  "z": "5a8afc5afb89916f",
  "g": "9c916f97d11d31cb",
  "name": "Succes/error",
  "property": "request_status",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "PENDING",
      "vt": "str"
    },
    {
      "t": "neq",
      "v": "PENDING",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 1690,
  "y": 60,
  "wires": [
    [
      "cd5458db88a6c3d8"
    ],
    [
      "1b98e8e8d5c29bbf"
    ]
  ],
  "_order": 201
}

module.exports = Node;