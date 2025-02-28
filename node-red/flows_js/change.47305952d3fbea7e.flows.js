const Node = {
  "id": "47305952d3fbea7e",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Angiv sti til regler i csv (evt. med tom værdi)",
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
  "x": 270,
  "y": 60,
  "wires": [
    [
      "12b79b33b84ebcc0"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;