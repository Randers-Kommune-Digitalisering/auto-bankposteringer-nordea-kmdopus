const Node = {
  "id": "d57cbca3b91dfc4b",
  "type": "change",
  "z": "6cc161e748b99815",
  "name": "Prod par.",
  "rules": [
    {
      "t": "set",
      "p": "method",
      "pt": "flow",
      "to": "POST",
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
      "to": "{\"scope\":[\"PAYMENTS_BROADBAND\",\"ACCOUNTS_BROADBAND\"],\"duration\":5,\"agreement_number\":\"47447409132\"}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "global",
      "to": "1",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 740,
  "y": 80,
  "wires": [
    [
      "6f31944caaf06a53"
    ]
  ],
  "_order": 87
}

module.exports = Node;