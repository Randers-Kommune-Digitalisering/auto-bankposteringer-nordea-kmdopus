const Node = {
  "id": "6420b1ed818447c7",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f5b0f2cb9d251540",
  "name": "Set vars",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "req.params.uid ~> $string()",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "transactions.manual",
      "pt": "global",
      "to": "$append(\t   $exists($globalContext(\"transactions\").manual) ? $globalContext(\"transactions\").manual : [],\t   payload\t)\t",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "dates.bookingDate",
      "pt": "global",
      "to": "payload.bookingDate",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "transactions.uid",
      "pt": "global",
      "to": "uid",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "res",
      "pt": "flow",
      "to": "res",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1075,
  "y": 160,
  "wires": [
    [
      "ea5478841b46be30"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;