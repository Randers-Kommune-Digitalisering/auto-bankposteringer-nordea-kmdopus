const Node = {
  "id": "cd1e537903e361c3",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "g": "6ff9877691fd4c6f",
  "name": "HTML",
  "field": "payload",
  "fieldType": "msg",
  "format": "html",
  "syntax": "mustache",
  "template": "",
  "x": 1210,
  "y": 420,
  "wires": [
    [
      "061724d02fe3c294"
    ]
  ],
  "_order": 151
}

Node.template = `
<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
  <meta charset="utf-8">
  <title>Konteringsregler</title>
  <style>
    {{{payload.style}}}
  </style>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Iconscout Link For Icons -->
  <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.0/css/line.css">
</head>

<body onload="wsConnect();" onunload="ws.disconnect();">
    <main class="ruleBox">
      <h1>Konteringsregler</h1>
      <ul class="nav">
        <li><a href="/info">Inaktive regler</a></li>
        <li><a href="/rules">Aktive regler</a></li>
      </ul class="nav">
      <main class="ruleWrapper ruleWrapper"></main>
      <footer>
        <button class="addRuleButton" onclick="generateNewRow()">Tilføj regel</button>
      </footer>
    </main>
  
  <script>
    const _rules = {{{payload.rules}}}
  </script>
  <script>
    {{{payload.script}}}
  </script>
</body>

</html>
`

module.exports = Node;