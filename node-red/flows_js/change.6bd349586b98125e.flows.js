const Node = {
  "id": "6bd349586b98125e",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "f3a6b40b4a2788e0",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "transactions",
      "pt": "global",
      "to": "payload.response.transactions",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "list_http_code",
      "pt": "global",
      "to": "payload.group_header.http_code",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1250,
  "y": 180,
  "wires": [
    [
      "3da754a7823b3706"
    ]
  ],
  "_order": 110
}

module.exports = Node;