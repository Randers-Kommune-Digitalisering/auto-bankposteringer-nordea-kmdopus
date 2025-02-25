const Node = {
  "id": "229e8b59eae25a36",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "586bba4061b1d3f2",
  "name": "Angiv data til FTP-forbindelse (KMD)",
  "rules": [
    {
      "t": "set",
      "p": "configs.ftp.dataProviderId",
      "pt": "global",
      "to": "6ROB",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.ftp.dataProviderIdCode",
      "pt": "global",
      "to": "730",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.ftp.compCode",
      "pt": "global",
      "to": "0020",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.ftp.prodEnv",
      "pt": "global",
      "to": "P04",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.send.rootFolder",
      "pt": "global",
      "to": "/fra-randers/",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.recieve.rootFolder",
      "pt": "global",
      "to": "/til-randers/",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 210,
  "y": 460,
  "wires": [
    [
      "ec44cd3280383d83"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;