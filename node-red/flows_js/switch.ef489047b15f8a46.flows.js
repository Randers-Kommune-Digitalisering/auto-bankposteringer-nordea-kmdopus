const Node = {
  "id": "ef489047b15f8a46",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "c3855a30da38df4f",
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
  "y": 240,
  "wires": [
    [
      "ef59c68be07e0a9b"
    ],
    [
      "a08015d04ee5f1fd"
    ],
    [
      "4ee43544775ac9aa"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;