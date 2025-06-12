const Node = {
  "id": "967851903743067c",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "429af30a15f7bb2e",
  "name": "Skriv mail",
  "rules": [
    {
      "t": "set",
      "p": "payload.from",
      "pt": "msg",
      "to": "configs.reminder.sender",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.to",
      "pt": "msg",
      "to": "masterData.admSysData.admEmail",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.title",
      "pt": "msg",
      "to": "configs.reminder.topic",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.body",
      "pt": "msg",
      "to": "configs.reminder.payload",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 155,
  "y": 720,
  "wires": [
    [
      "fa0e33087ff529cc"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;