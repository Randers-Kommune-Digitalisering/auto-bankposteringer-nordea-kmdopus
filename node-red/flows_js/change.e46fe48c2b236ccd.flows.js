const Node = {
  "id": "e46fe48c2b236ccd",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "dato",
      "pt": "msg",
      "to": "date",
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
  "y": 1020,
  "wires": [
    [
      "f718f404c61cc2b0"
    ]
  ],
  "l": false
}

module.exports = Node;