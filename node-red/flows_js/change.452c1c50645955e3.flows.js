const Node = {
  "id": "452c1c50645955e3",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "73b9b3deaf04ef3b",
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
  "x": 405,
  "y": 460,
  "wires": [
    [
      "40d33e0d6ce61317",
      "54bfce6c5e422ed6"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;