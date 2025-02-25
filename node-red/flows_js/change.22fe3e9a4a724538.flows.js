const Node = {
  "id": "22fe3e9a4a724538",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "set ftp properties",
  "rules": [
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
  "x": 305,
  "y": 320,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;