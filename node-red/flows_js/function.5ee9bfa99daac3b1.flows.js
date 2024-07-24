const Node = {
  "id": "5ee9bfa99daac3b1",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Regex",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1345,
  "y": 400,
  "wires": [
    [
      "741d4ceab497dc4d"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const element = 'Opret ny regel:Tilføj';
  let regex = "";
  flow.set("altPayload", msg.payload);
  
  switch (msg.topic) {
      case "PSP":
          regex = /^XG-\d{10}-\d{5}$/i;
          break;
      case "Artskonto":
          regex = /^\d{8}$/;
          break;
  }
  
  if (regex.test(msg.payload)) {
      msg.regex = true;
  } else {
      msg.regex = false;
      msg.error = msg.topic + " er ikke korrekt udfyldt";
  }
  
  if (!msg.regex) {
      msg.payload = {
          groups: {
              hide: [element]
          }
      };
  } else {
      msg.payload = {
          groups: {
              show: [element]
          }
      };
  }
  
  return msg;
}

module.exports = Node;