const Node = {
  "id": "119405a3f3673e41",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "ed2d8f9a9a392f4a",
  "name": "Clean and save data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 645,
  "y": 560,
  "wires": [
    [
      "0bfa10602429740f"
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
  
  if (masterDataObj.admSysData.accessToken) {
      authObj.adminStatus = "COMPLETED";
  }
  
  global.set("auth", authObj);
  global.set("masterData", masterDataObj);
  
  return msg;
}

module.exports = Node;