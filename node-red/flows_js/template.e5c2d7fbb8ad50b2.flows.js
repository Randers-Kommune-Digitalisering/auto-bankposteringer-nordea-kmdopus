const Node = {
  "id": "e5c2d7fbb8ad50b2",
  "type": "template",
  "z": "0bc16db685bd2e6a",
  "name": "HTML",
  "field": "payload",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 850,
  "y": 180,
  "wires": [
    [
      "c3876d6450ff6eb2",
      "e7392728b4698670"
    ]
  ],
  "_order": 61
}

Node.template = `
<!DOCTYPE html>
<html>
    <head>
        <style type="text/css">
{{{payload.style}}}
        </style>
        <script type="application/javascript">
{{{payload.javascript}}}
        </script>
    </head>
<body>

<h1>My First Heading</h1>
<p>My first paragraph.</p>

</body>
</html>
`

module.exports = Node;