const Node = {
  "id": "d5a8b29213da8a23",
  "type": "function",
  "z": "a1dc9966e881ac6b",
  "g": "24481f222bcf4517",
  "name": "Clean and save data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1235,
  "y": 320,
  "wires": [
    [
      "55be988b9af8045a"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let masterDataObj = global.get("masterData") ? global.get("masterData") : {};
  let authObj = global.get("auth") ? global.get("auth") : {};
  
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
  
  masterDataObj.admSysData = msg.payload[0];
  
  if (masterDataObj.admSysData.accessToken) { authObj.adminStatus = "ACTIVE"; }
  
  global.set("auth", authObj);
  global.set("masterData", masterDataObj);
  
  return msg;
}

module.exports = Node;