const Node = {
  "id": "ec44cd3280383d83",
  "type": "change",
  "z": "431f85f122b4636d",
  "name": "Set FTP filename",
  "rules": [
    {
      "t": "set",
      "p": "configs.ftp.filename",
      "pt": "global",
      "to": "\"ZFIR_KMD_Opus_Posteringer_IND_\" & $globalContext(\"configs\").ftp.dataProviderIdCode & \"_\" & $globalContext(\"configs\").ftp.dataProviderId & \"_\" & $globalContext(\"dateOfOrigin\") & \"_\" & $globalContext(\"timeOfOrigin\") & \".xml\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.send.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.send.rootFolder & $globalContext(\"configs\").ftp.filename",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.recieve.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.recieve.rootFolder & $globalContext(\"configs\").ftp.filename",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 395,
  "y": 460,
  "wires": [
    [
      "e831658a737feae9",
      "c4d60da477b26efd"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;