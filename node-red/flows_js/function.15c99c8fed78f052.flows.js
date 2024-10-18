const Node = {
  "id": "15c99c8fed78f052",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "Clean and save data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 305,
  "y": 600,
  "wires": [
    [
      "ef6284f0a3e0f632"
    ]
  ],
  "icon": "font-awesome/fa-save",
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
  
  msg.payload = msg.payload[0];
  
  global.set("masterData", msg.payload);
  
  return msg;
}

module.exports = Node;