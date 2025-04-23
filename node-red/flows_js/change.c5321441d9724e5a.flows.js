const Node = {
  "id": "c5321441d9724e5a",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f20ee67701d7b737",
  "name": "file path",
  "rules": [
    {
      "t": "set",
      "p": "filepath",
      "pt": "msg",
      "to": "$substring(req.params.file, -11) = \"_afstem.csv\"\t    ? \"/data/afstemning/\" & req.params.file\t    : \"/data/output/\" & req.params.file\t",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 295,
  "y": 240,
  "wires": [
    [
      "562df64dddd747e1"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;