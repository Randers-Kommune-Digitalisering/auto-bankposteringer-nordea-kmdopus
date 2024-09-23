const Node = {
  "id": "1999f3203f3ab7ce",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "Remove id part of each line",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$replace($replace(payload, /(<LINE_\\d+_>)/, \"<LINE>\"), /(<\\/LINE_\\d+_>)/, \"</LINE>\")",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "localFilename",
      "pt": "msg",
      "to": "configs.ftp.filepaths.local.fullPath",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "filename",
      "pt": "msg",
      "to": "configs.ftp.filepaths.remote.fullPath",
      "tot": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 455,
  "y": 240,
  "wires": [
    [
      "320460172b7a9a11"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

module.exports = Node;