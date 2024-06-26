const Node = {
  "id": "62cb767a8e2fac60",
  "type": "change",
  "z": "f91accb007eed9a2",
  "g": "1fb8657a805b873c",
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
      "to": "filenameFTPlocal",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "filename",
      "pt": "msg",
      "to": "filenameFTPremote",
      "tot": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 445,
  "y": 240,
  "wires": [
    [
      "c1f015bf445178cd"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

module.exports = Node;