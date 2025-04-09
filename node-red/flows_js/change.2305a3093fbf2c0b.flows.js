const Node = {
  "id": "2305a3093fbf2c0b",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "transactions.uid",
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
      "p": "transactions.add",
      "pt": "global",
      "to": "payload.response.transactions ? $reverse(payload.response.transactions) : null",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "transactions.continuationKey",
      "pt": "global",
      "to": "payload.response.continuation_key ? payload.response.continuation_key : null",
      "tot": "jsonata",
      "dc": true
    },
    {
      "t": "set",
      "p": "auth.adminStatus",
      "pt": "global",
      "to": "statusCode = 401 ? \"EXPIRED\" : $globalContext(\"auth\").adminStatus",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 495,
  "y": 460,
  "wires": [
    [
      "03d05c73a6202e73"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;