const Node = {
  "id": "ef6f93387cb09e7d",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "f3a6b40b4a2788e0",
  "name": "Clear objects",
  "rules": [
    {
      "t": "delete",
      "p": "_msgid",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "payload",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "headers",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "statusCode",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "responseUrl",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "redirectList",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "retry",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "url",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "data",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "query_param",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "query_param1",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "query_param2",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "path_suffix",
      "pt": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 290,
  "y": 180,
  "wires": [
    [
      "68079c74979ba90f"
    ]
  ],
  "_order": 112
}

module.exports = Node;