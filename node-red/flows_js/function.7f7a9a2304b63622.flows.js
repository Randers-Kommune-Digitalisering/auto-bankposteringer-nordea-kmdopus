const Node = {
  "id": "7f7a9a2304b63622",
  "type": "function",
  "z": "30ea9c666c3d34a6",
  "g": "0679a4a5b7de02c4",
  "name": "Spread msg",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 105,
  "y": 780,
  "wires": [
    [
      "9c872303673d278a"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const notifications = global.get("notifications");
  let inputArray = [];
  
  if (Array.isArray(notifications)) {
      inputArray = notifications;
  } else if (notifications && typeof notifications === "object") {
      inputArray = [notifications];
  }
  
  if (!inputArray.length) return null;
  
  for (let obj of inputArray) {
      const newMsg = {
          payload: {
              from: global.get("configs").reminder.sender,
              to: obj.recipient,
              title: "Indbetaling modtaget og bogført",
              body: obj.text
          }
      };
      node.send(newMsg); // send individuelt
  }
  
  return null;
}

module.exports = Node;