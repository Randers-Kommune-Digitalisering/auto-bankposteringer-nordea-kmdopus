const Node = {
  "id": "a248caa2a5a82bc5",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "d": true,
  "g": "c076bc29b23b9bd7",
  "name": "HTML",
  "field": "payload",
  "fieldType": "msg",
  "format": "html",
  "syntax": "mustache",
  "template": "",
  "x": 390,
  "y": 600,
  "wires": [
    [
      "eaa7010fccf43e50"
    ]
  ],
  "_order": 147
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