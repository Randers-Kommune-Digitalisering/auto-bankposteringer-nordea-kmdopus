const Node = {
  "id": "d6022ba6c20ab970",
  "type": "change",
  "z": "8983772ca1c7d013",
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
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 540,
  "y": 180,
  "wires": [
    [
      "da504a28d8d0fe91"
    ]
  ],
  "_order": 24
}

module.exports = Node;