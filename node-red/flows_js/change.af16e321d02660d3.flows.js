const Node = {
  "id": "af16e321d02660d3",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "2be87d58205e8592",
  "name": "Skriv mail",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "\"Indlæsningen af bankposteringer kræver din godkendelse i Nordea ID-appen\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "Godkendelse i Nordea ID (autogenereret mail)",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1300,
  "y": 540,
  "wires": [
    [
      "087017bd42378102"
    ]
  ],
  "_order": 167
}

module.exports = Node;