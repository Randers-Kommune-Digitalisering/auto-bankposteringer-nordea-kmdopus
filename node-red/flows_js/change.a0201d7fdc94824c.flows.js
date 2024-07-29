const Node = {
  "id": "a0201d7fdc94824c",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
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
  "x": 695,
  "y": 300,
  "wires": [
    [
      "986b86a2606b41ce"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;