const Node = {
  "id": "40e113723c283e83",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "18ec65b7f9e9459e",
  "name": "Action?",
  "property": "action",
  "propertyType": "flow",
  "rules": [
    {
      "t": "eq",
      "v": "auth",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "transactionList",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "transactionListNext",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 205,
  "y": 220,
  "wires": [
    [
      "0696e3a65caeb94f"
    ],
    [
      "c5d0f25bad1d9b4c"
    ],
    [
      "58255b0f0656e6c2"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;