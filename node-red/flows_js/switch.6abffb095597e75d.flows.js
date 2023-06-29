const Node = {
  "id": "6abffb095597e75d",
  "type": "switch",
  "z": "9f235917ac3d8025",
  "name": "",
  "property": "payload.request",
  "propertyType": "msg",
  "rules": [
    {
      "t": "eq",
      "v": "getPublicKey",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "uploadData",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 410,
  "y": 420,
  "wires": [
    [
      "ddd22258c81e977f"
    ],
    [
      "6e92272b917ef904"
    ]
  ],
  "_order": 97
}

module.exports = Node;