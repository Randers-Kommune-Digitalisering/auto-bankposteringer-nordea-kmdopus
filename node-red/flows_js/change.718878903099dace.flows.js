const Node = {
  "id": "718878903099dace",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "608c296403fab569",
  "name": "Clean",
  "rules": [
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
    },
    {
      "t": "delete",
      "p": "filename",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "columns",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1090,
  "y": 700,
  "wires": [
    [
      "2783b3bef5ec4879"
    ]
  ],
  "_order": 199
}

module.exports = Node;