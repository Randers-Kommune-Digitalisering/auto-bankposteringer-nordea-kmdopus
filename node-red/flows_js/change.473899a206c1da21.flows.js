const Node = {
  "id": "473899a206c1da21",
  "type": "change",
  "z": "8983772ca1c7d013",
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
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 540,
  "y": 140,
  "wires": [
    [
      "ba1ee39dd5ee47d5"
    ]
  ],
  "_order": 22
}

module.exports = Node;