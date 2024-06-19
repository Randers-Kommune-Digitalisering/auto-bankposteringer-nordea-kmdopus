const Node = {
  "id": "4255d18a1fe6c5d1",
  "type": "change",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "flow to msg",
  "rules": [
    {
      "t": "delete",
      "p": "transactions",
      "pt": "global"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "erp_array",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "erp_file_headers",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 295,
  "y": 60,
  "wires": [
    [
      "7752629d4e44c49b"
    ]
  ],
  "l": false
}

module.exports = Node;