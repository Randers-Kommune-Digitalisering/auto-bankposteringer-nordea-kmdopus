const Node = {
  "id": "739625cea7b2fddc",
  "type": "template",
  "z": "9f235917ac3d8025",
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
      "f9492b5f42444803",
      "b4661d43313539f2"
    ]
  ],
  "_order": 84
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