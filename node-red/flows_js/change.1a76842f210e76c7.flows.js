const Node = {
  "id": "1a76842f210e76c7",
  "type": "change",
  "z": "7cf1e6fdd27d0bd8",
  "g": "c2ddb5ae767f1292",
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
      "tot": "flow"
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
  "x": 150,
  "y": 60,
  "wires": [
    [
      "f9e539bdc6717683"
    ]
  ],
  "_order": 232
}

module.exports = Node;