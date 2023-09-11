const Node = {
  "id": "dda6734dcb9ab021",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "9624c5429dc0adc3",
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
  "y": 980,
  "wires": [
    [
      "daa8c6f605d38390"
    ]
  ],
  "_order": 126
}

module.exports = Node;