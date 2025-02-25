const Node = {
  "id": "b023cb0d9a7c23ee",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "54195acebfd77c6b",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "adminAuthStatus",
      "pt": "global",
      "to": "RESTARTING",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "AuthRestart",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 765,
  "y": 60,
  "wires": [
    [
      "d707d5698ec5039a"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;