const Node = {
  "id": "52e841e6c9682c48",
  "type": "change",
  "z": "6cc161e748b99815",
  "g": "b23b428a2893858e",
  "name": "Clear msg",
  "rules": [
    {
      "t": "delete",
      "p": "_event",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "_msgid",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "headers",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "url",
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
      "p": "payload",
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
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 170,
  "y": 560,
  "wires": [
    [
      "85e90a755f43672e"
    ]
  ],
  "_order": 55
}

module.exports = Node;