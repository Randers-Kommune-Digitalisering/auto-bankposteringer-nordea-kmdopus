const Node = {
  "id": "e7caa13b5c564e23",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "af9e589c452c6701",
  "name": "SFTP",
  "rules": [
    {
      "t": "set",
      "p": "configs.ftp.dataProviderId",
      "pt": "global",
      "to": "ERP_DATAPROVIDERID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.ftp.dataProviderIdCode",
      "pt": "global",
      "to": "ERP_DATAPROVIDERIDCODE",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.compCode",
      "pt": "global",
      "to": "ERP_COMPCODE",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.ftp.prodEnv",
      "pt": "global",
      "to": "ERP_PRODENV",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.send.rootFolder",
      "pt": "global",
      "to": "SFTP_SEND_DIR",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.recieve.rootFolder",
      "pt": "global",
      "to": "SFTP_RECEIVE_DIR",
      "tot": "env"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 170,
  "y": 300,
  "wires": [
    [
      "c2fdaae0d1892d6e"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;