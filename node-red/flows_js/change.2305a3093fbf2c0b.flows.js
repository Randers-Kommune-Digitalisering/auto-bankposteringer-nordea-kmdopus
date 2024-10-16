const Node = {
  "id": "2305a3093fbf2c0b",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "messageIdentification",
      "pt": "global",
      "to": "payload.group_header.message_identification",
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
      "p": "addTransactions",
      "pt": "global",
      "to": "payload.response.transactions ? payload.response.transactions : null",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "continuation_key",
      "pt": "flow",
      "to": "payload.response.continuation_key ? payload.response.continuation_key : null",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 945,
  "y": 300,
  "wires": [
    [
      "53b00b686c170d67",
      "a1f41777ba5459a4"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;