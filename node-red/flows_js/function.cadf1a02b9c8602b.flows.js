const Node = {
  "id": "cadf1a02b9c8602b",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "08a9715c85ab97c1",
  "name": "Clean data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 955,
  "y": 240,
  "wires": [
    [
      "89a0e2e2db597fe4"
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
      convertToBoolean(item, ["ActiveBool", "ExceptionBool"]);
  });
  
  return msg;
  
}

module.exports = Node;