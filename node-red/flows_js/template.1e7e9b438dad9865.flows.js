const Node = {
  "id": "1e7e9b438dad9865",
  "type": "template",
  "z": "32cf2bec698ca424",
  "g": "1ab12c0299de8032",
  "name": "Construct SQL Query",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 755,
  "y": 120,
  "wires": [
    [
      "1bbde22550adb612"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM
    accountingRules
WHERE
    RuleID = {{uid}}
`

module.exports = Node;