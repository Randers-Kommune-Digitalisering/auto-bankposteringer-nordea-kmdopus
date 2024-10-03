const Node = {
  "id": "d5a67555f8a8e839",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "d8a47ce7011eecce",
  "name": "Angiv Open Banking oplysninger",
  "rules": [
    {
      "t": "set",
      "p": "configs.banking.provider",
      "pt": "global",
      "to": "Nordea",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 190,
  "y": 780,
  "wires": [
    [
      "73c44aac8d924f2a"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;