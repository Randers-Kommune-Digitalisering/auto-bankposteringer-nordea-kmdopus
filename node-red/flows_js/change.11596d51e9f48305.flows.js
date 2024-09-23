const Node = {
  "id": "11596d51e9f48305",
  "type": "change",
  "z": "92c28da6a66fdcb3",
  "g": "82c2533175513d9e",
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
  "x": 205,
  "y": 680,
  "wires": [
    [
      "f10ec89ac312f562"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;