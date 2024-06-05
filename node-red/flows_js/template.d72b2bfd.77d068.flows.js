const Node = {
  "id": "d72b2bfd.77d068",
  "type": "template",
  "z": "f91accb007eed9a2",
  "name": "",
  "field": "payload",
  "fieldType": "msg",
  "format": "text",
  "syntax": "plain",
  "template": "",
  "output": "str",
  "x": 780,
  "y": 800,
  "wires": [
    [
      "1746464a.87aa4a"
    ]
  ]
}

Node.template = `
<note priority="high">
  <to>Nick</to>
  <from>Dave</from>
  <heading>Reminder</heading>
  <body>Update the website</body>
</note>
`

module.exports = Node;