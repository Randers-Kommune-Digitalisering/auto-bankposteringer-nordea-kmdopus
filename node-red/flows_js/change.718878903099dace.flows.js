const Node = {
  "id": "718878903099dace",
  "type": "change",
  "z": "707b29a288c1c947",
  "g": "3d885db7955a47b8",
  "name": "clean data",
  "rules": [
    {
      "t": "delete",
      "p": "filename",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "columns",
      "pt": "msg"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "nomatch_list",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "data",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 290,
  "y": 140,
  "wires": [
    [
      "2783b3bef5ec4879"
    ]
  ],
  "_order": 254
}

module.exports = Node;