const Node = {
  "id": "f47731a47fe46914",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "2c7913f560d4d1e7",
  "name": "Angiv sti til konteringsregler",
  "rules": [
    {
      "t": "set",
      "p": "configs.jsonPath",
      "pt": "global",
      "to": "/data/konteringsregler/konteringsregler.json",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 180,
  "y": 60,
  "wires": [
    [
      "ce652c91b65c9e6e"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;