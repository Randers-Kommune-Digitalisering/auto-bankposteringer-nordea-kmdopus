const Node = {
  "id": "f9fac465a389e1ae",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "586bba4061b1d3f2",
  "name": "Set FTP filename",
  "rules": [
    {
      "t": "set",
      "p": "configs.ftp.filename",
      "pt": "global",
      "to": "\"\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.local.fullPath",
      "pt": "global",
      "to": "\"\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.remote.fullPath",
      "pt": "global",
      "to": "\"\"",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 405,
  "y": 520,
  "wires": [
    [
      "12b79b33b84ebcc0"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;