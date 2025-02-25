const Node = {
  "id": "cadf1a02b9c8602b",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Clean and save data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 305,
  "y": 500,
  "wires": [
    [
      "aafca5b9d325f315"
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
      convertToBoolean(item, ["ActiveBool", "ExceptionBool"]);
  });
  
  global.set("accountingRules", msg.payload);
  
  return msg;
  
}

module.exports = Node;