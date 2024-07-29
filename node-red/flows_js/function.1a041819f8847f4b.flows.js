const Node = {
  "id": "1a041819f8847f4b",
  "type": "function",
  "z": "74de194f4f0868a4",
  "d": true,
  "g": "ada765780fa31438",
  "name": "function 1",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 675,
  "y": 440,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const string = msg.topic;
  
  global.set(string, msg.payload);
  
  return msg;
}

module.exports = Node;