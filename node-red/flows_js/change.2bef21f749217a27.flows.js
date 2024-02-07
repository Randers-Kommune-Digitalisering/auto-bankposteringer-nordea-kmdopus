const Node = {
  "id": "2bef21f749217a27",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "d6d5f4ec783b7505",
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
  "x": 1800,
  "y": 60,
  "wires": [
    [
      "c9b71d6eea7c0ed6"
    ]
  ],
  "_order": 163
}

module.exports = Node;