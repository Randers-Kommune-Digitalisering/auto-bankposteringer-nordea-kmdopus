const Node = {
  "id": "47305952d3fbea7e",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "2c7913f560d4d1e7",
  "name": "Angiv evt. sti til regler der skal importeres",
  "rules": [
    {
      "t": "set",
      "p": "configs.csvPath",
      "pt": "global",
      "to": "/data/konteringsregler/konteringsregler.csv",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 220,
  "y": 60,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;