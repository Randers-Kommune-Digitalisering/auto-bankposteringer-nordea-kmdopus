const Node = {
  "id": "e4d850011ccad60f",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "Set flow vars",
  "rules": [
    {
      "t": "set",
      "p": "adminAuthAttempt",
      "pt": "global",
      "to": "0",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "banking_domain",
      "pt": "flow",
      "to": "https://open.nordea.com",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "0",
      "tot": "num"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 455,
  "y": 60,
  "wires": [
    [
      "dbf9bf32ce3c4f70"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;