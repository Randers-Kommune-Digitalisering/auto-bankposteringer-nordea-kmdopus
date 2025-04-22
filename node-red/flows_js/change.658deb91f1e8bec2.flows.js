const Node = {
  "id": "658deb91f1e8bec2",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "977504c173614784",
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
      "c2c41f96d66d4c63"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;