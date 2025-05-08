const Node = {
  "id": "e71fc547a36a4f03",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "e213a029bb7d65e7",
  "name": "Merge",
  "rules": [
    {
      "t": "set",
      "p": "files",
      "pt": "msg",
      "to": "$map(files, function($value, $index) {\t    {\t        \"filename\": $value,\t        \"birthtime\": stats[$index].birthtime\t    }\t})",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 275,
  "y": 1100,
  "wires": [
    [
      "check-files"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;