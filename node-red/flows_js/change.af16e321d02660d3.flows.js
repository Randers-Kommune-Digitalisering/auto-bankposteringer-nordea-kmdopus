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
      "to": "\"Hej Jan,\\nNordea bankindlæsning kræver din godkendelse i Nordea ID-appen\\nTak for hjælpen.\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "Godkendelse i Nordea ID",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 660,
  "y": 400,
  "wires": [
    [
      "0a88af3e0d70cfe6"
    ]
  ],
  "_order": 117
}

module.exports = Node;