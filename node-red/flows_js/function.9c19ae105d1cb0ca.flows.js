const Node = {
  "id": "9c19ae105d1cb0ca",
  "type": "function",
  "z": "a1dc9966e881ac6b",
  "g": "d992b55d9d319a30",
  "name": "Clean and save data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 215,
  "y": 440,
  "wires": [
    [
      "8fe888f977bca342"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let masterDataObj = global.get("masterData");
  const accountingRules = global.get("masterData").rules;
  
  const convertToBoolean = (obj, keys) => {
      keys.forEach(key => {
          if (obj.hasOwnProperty(key)) {
              obj[key] = obj[key] === 1 ? true : obj[key] === 0 ? false : obj[key];
          }
      });
  };
  
  function calculateSpecificity(rule) {
      // Count the number of rule parameters where the value property is defined (truthy)
      return Object.keys(rule)
          .slice(0, 2)
          .filter(key => rule[key] || rule[key] || rule[key]).length;
  }
  
  function merge(left, right) {
      let result = [];
      let leftIndex = 0;
      let rightIndex = 0;
  
      while (leftIndex < left.length && rightIndex < right.length) {
          if (calculateSpecificity(left[leftIndex]) > calculateSpecificity(right[rightIndex])) {
              result.push(left[leftIndex]);
              leftIndex++;
          } else {
              result.push(right[rightIndex]);
              rightIndex++;
          }
      }
      return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
  }
  
  function mergeSort(arr) {
      if (arr.length <= 1) { return arr; }
  
      const middle = Math.floor(arr.length / 2);
      const left = arr.slice(0, middle);
      const right = arr.slice(middle);
  
      return merge(mergeSort(left), mergeSort(right));
  }
  
  msg.payload.forEach(item => {
      convertToBoolean(item, ["activeBool", "exceptionBool", "tempBool", "postWithCPR"]);
  });
  
  masterDataObj.rules = mergeSort(msg.payload)
  global.set("masterData", masterDataObj);
  
  return msg;
}

module.exports = Node;