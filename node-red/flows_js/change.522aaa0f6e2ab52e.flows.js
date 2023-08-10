const Node = {
  "id": "522aaa0f6e2ab52e",
  "type": "change",
  "z": "6cc161e748b99815",
  "name": "Test par.",
  "rules": [
    {
      "t": "set",
      "p": "method",
      "pt": "flow",
      "to": "PUT",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "path",
      "pt": "flow",
      "to": "/corporate/v2/authorize",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "content-type",
      "pt": "flow",
      "to": "application/json",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "data",
      "pt": "flow",
      "to": "{\"authorizer_id\":\"70311198\"}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "query_param",
      "pt": "flow",
      "to": "access_id",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "global",
      "to": "2",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 740,
  "y": 200,
  "wires": [
    [
      "20fe3580deb4db6b"
    ]
  ],
  "_order": 18
}

module.exports = Node;