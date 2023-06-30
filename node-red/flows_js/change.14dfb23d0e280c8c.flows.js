const Node = {
  "id": "14dfb23d0e280c8c",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
  "name": "Set params for Initiate Auth",
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
      "to": "{\"scope\":[\"PAYMENTS_BROADBAND\",\"ACCOUNTS_BROADBAND\"],\"duration\":129600,\"agreement_number\":\"130474822427\"}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "global",
      "to": "1",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 900,
  "y": 120,
  "wires": [
    [
      "6de4d8754026cefc"
    ]
  ],
  "_order": 9
}

module.exports = Node;