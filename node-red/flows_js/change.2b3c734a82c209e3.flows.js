const Node = {
  "id": "2b3c734a82c209e3",
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
      "p": "configs.ftp.filepaths.local.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.local.rootFolder&$globalContext(\"configs\").ftp.filename",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.ftp.filepaths.remote.fullPath",
      "pt": "global",
      "to": "$globalContext(\"configs\").ftp.filepaths.remote.rootFolder&$globalContext(\"configs\").ftp.filename",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 395,
  "y": 500,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;