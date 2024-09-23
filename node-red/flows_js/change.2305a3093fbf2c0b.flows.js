const Node = {
  "id": "2305a3093fbf2c0b",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "addTransactions",
      "pt": "global",
      "to": "payload.response.transactions",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "statusCode",
      "pt": "msg",
      "to": "payload.group_header.http_code",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "continuation_key",
      "pt": "flow",
      "to": "payload.response.continuation_key",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 945,
  "y": 280,
  "wires": [
    [
      "d9447d0752f06d96"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;