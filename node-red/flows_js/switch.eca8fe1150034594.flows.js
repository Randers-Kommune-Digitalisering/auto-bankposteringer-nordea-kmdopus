const Node = {
  "id": "eca8fe1150034594",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "429af30a15f7bb2e",
  "name": "",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "CREATED",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 105,
  "y": 680,
  "wires": [
    [
      "967851903743067c"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;