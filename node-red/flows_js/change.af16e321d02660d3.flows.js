const Node = {
  "id": "af16e321d02660d3",
  "type": "change",
  "z": "5a8afc5afb89916f",
  "g": "bb5f697092a1318e",
  "name": "Skriv mail",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "\"Indlæsningen af bankposteringer kræver din godkendelse\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "Godkendelse af automatisk bankindlæsning (autogenereret mail)",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 220,
  "y": 740,
  "wires": [
    [
      "087017bd42378102"
    ]
  ],
  "_order": 209
}

module.exports = Node;