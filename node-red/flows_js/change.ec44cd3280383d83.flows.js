const Node = {
  "id": "ec44cd3280383d83",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "586bba4061b1d3f2",
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
  "x": 405,
  "y": 480,
  "wires": [
    [
      "12b79b33b84ebcc0"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;