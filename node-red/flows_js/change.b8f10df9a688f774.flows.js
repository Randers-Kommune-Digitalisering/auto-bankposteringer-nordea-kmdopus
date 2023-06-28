const Node = {
  "id": "b8f10df9a688f774",
  "type": "change",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Set params for Confirm Auth",
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
  "x": 960,
  "y": 160,
  "wires": [
    [
      "741f8ebe67dc7e24"
    ]
  ],
  "_order": 22
}

module.exports = Node;