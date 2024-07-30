const Node = {
  "id": "296418615162d50e",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "9a13326620241f51",
  "name": "Clean data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 285,
  "y": 440,
  "wires": [
    [
      "91b06b6df33983e7"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const convertToBoolean = (obj, keys) => {
      keys.forEach(key => {
          if (obj.hasOwnProperty(key)) {
              obj[key] = obj[key] === 1 ? true : obj[key] === 0 ? false : obj[key];
          }
      });
  };
  
  msg.payload.forEach(item => {
      //item.data = JSON.parse(item.data);
      convertToBoolean(item, ["Active", "Exception"]);
      //item.data.id = item.id;  // Restore the original ID
  });
  
  return msg;
  
}

module.exports = Node;