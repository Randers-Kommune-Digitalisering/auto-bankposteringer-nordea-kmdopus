const Node = {
  "id": "767ee33b2d96669f",
  "type": "change",
  "z": "92c28da6a66fdcb3",
  "g": "82c2533175513d9e",
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
  "x": 205,
  "y": 800,
  "wires": [
    [
      "f10ec89ac312f562"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;