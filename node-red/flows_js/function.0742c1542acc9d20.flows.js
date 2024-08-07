const Node = {
  "id": "0742c1542acc9d20",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "45ded2ca44d7d129",
  "name": "Clean data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1005,
  "y": 580,
  "wires": [
    [
      "522304dd3d10492e"
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
      convertToBoolean(item, ["integrationBool"]);
  });
  
  msg.payload = JSON.parse(JSON.stringify(msg.payload));
  
  msg.payload = msg.payload[0]
  
  return msg;
}

module.exports = Node;