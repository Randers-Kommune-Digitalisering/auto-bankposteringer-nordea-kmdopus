const Node = {
  "id": "a0201d7fdc94824c",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "add_transactions",
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
    },
    {
      "t": "delete",
      "p": "link_to_next_page",
      "pt": "flow"
    },
    {
      "t": "set",
      "p": "link_to_next_page",
      "pt": "flow",
      "to": "$map(\t    $filter(msg.payload.response._links, function($l) {\t        $l.rel = \"next\"\t    }),\t    function($l) {\t        $l.href\t    }\t)\t",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 830,
  "y": 280,
  "wires": [
    [
      "986b86a2606b41ce"
    ]
  ]
}

module.exports = Node;