const Node = {
  "id": "5d472e55a89e7806",
  "type": "change",
  "z": "88c6307a5ee1dd81",
  "g": "0fc5db670402470f",
  "name": "Set FTP filename",
  "rules": [
    {
      "t": "set",
      "p": "configs.ftp.filepaths.send.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.send.rootFolder & filename",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.recieve.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.recieve.rootFolder & filename",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 255,
  "y": 220,
  "wires": [
    [
      "2b4392f9b1cb1e6b"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;