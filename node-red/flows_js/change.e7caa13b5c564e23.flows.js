const Node = {
  "id": "e7caa13b5c564e23",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "af9e589c452c6701",
  "name": "KMD ftp",
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
  "x": 180,
  "y": 300,
  "wires": [
    [
      "c2fdaae0d1892d6e"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;