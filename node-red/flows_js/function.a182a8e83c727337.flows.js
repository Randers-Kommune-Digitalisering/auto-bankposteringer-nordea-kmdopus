const Node = {
  "id": "a182a8e83c727337",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "4571d34d4f5bd1cf",
  "name": "Regex",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 445,
  "y": 820,
  "wires": [
    [
      "e82a0e070d020b5b",
      "20af7c75df772c06"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let regex = "";
  msg.regex = true;
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
  
  if (!msg.regex && msg.topic === "Artskonto") {
      msg.payload = {
          groups: {
              hide: ['Ny regel:Tilføj']
          }
      };
  } else {
      msg.payload = {
          groups: {
              show: ['Ny regel:Tilføj']
          }
      };
  }
  
  return msg;
  
}

module.exports = Node;