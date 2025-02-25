const Node = {
  "id": "1e3e96dcc3813813",
  "type": "change",
  "z": "431f85f122b4636d",
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
  "x": 395,
  "y": 540,
  "wires": [
    [
      "e831658a737feae9"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;