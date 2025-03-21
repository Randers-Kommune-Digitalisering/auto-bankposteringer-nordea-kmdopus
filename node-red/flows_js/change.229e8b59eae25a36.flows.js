const Node = {
  "id": "229e8b59eae25a36",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "586bba4061b1d3f2",
  "name": "KMD",
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
      "to": "/data/output/",
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
  "x": 150,
  "y": 480,
  "wires": [
    [
      "1af0b485f8baaab1"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;