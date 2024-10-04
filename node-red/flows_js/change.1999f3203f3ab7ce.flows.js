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
      "p": "filename",
      "pt": "msg",
      "to": "configs.ftp.filepaths.local.fullPath",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 605,
  "y": 200,
  "wires": [
    [
      "320460172b7a9a11"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;