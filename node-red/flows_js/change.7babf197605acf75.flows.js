const Node = {
  "id": "7babf197605acf75",
  "type": "change",
  "z": "431f85f122b4636d",
  "name": "Set all filepaths",
  "rules": [
    {
      "t": "set",
      "p": "configs.csvPath",
      "pt": "global",
      "to": "/data/konteringsregler/konteringsregler.csv",
      "tot": "str"
    },
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
  "x": 360,
  "y": 40,
  "wires": [
    [
      "ce41aad1a3978514"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;