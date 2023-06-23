const Node = {
  "id": "473899a206c1da21",
  "type": "change",
  "z": "8983772ca1c7d013",
  "name": "Initiate Auth request",
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
      "p": "url",
      "pt": "flow",
      "to": "https://api.nordeaopenbanking.com/corporate/v2/authorize",
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
  "x": 600,
  "y": 100,
  "wires": [
    [
      "ba1ee39dd5ee47d5",
      "d6fc487958714237"
    ]
  ],
  "_order": 37
}

module.exports = Node;