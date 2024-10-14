const Node = {
  "id": "c9a687a327be80e7",
  "type": "template",
  "z": "b0363dafd369e927",
  "name": "",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 340,
  "y": 280,
  "wires": [
    [
      "7f418d8a36745b11"
    ]
  ]
}

Node.template = `
CREATE TABLE IF NOT EXISTS runHistory (
    ts timestamp,
    uid INT NOT NULL  AUTO_INCREMENT,
    dato DATE,
    success BOOL,
    PRIMARY KEY (uid)
)
`

module.exports = Node;