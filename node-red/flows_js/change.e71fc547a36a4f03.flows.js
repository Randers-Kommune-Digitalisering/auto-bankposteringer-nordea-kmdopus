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
      "to": "$map(files, function($value, $index) {\t    {\t        \"filename\": $value,\t        \"birthtime\": stats[$index].mtime\t    }\t})",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "filesCount",
      "pt": "msg",
      "to": "$count(files)",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 225,
  "y": 1220,
  "wires": [
    [
      "374a53ba4bf9667e"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;