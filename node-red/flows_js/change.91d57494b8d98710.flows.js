const Node = {
  "id": "91d57494b8d98710",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "restartUid",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "success",
      "pt": "msg",
      "to": "$globalContext(\"errorEncountered\") ? false : true",
      "tot": "jsonata"
    },
    {
      "t": "delete",
      "p": "restartUid",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "isRestart",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "errorEncountered",
      "pt": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 485,
  "y": 980,
  "wires": [
    [
      "c40228fc31a4eb75"
    ]
  ],
  "l": false
}

module.exports = Node;