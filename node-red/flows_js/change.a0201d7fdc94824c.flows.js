const Node = {
  "id": "a0201d7fdc94824c",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "hovedkonto_transactions",
      "pt": "flow",
      "to": "payload.response.transactions",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "list_http_code",
      "pt": "flow",
      "to": "payload.group_header.http_code",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 870,
  "y": 280,
  "wires": [
    [
      "3bf0fcec8ac96b0c",
      "4e384ce7a5fd0cec"
    ]
  ],
  "_order": 178
}

module.exports = Node;