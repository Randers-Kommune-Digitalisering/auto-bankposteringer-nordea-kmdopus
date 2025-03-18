const Node = {
  "id": "a4bc53036845979e",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 535,
  "y": 240,
  "wires": [
    [
      "7479d1a84703884e"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS runHistory (
    uid NVARCHAR(32) PRIMARY KEY,
    originDate DATE,
    statusCode INT,
    ts timestamp,
    success BOOL
)
`

module.exports = Node;