const Node = {
  "id": "aafca5b9d325f315",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Sort accountingRules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 355,
  "y": 400,
  "wires": [
    [
      "3150084866746144"
    ]
  ],
  "icon": "font-awesome/fa-sort-numeric-desc",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const accountingRules = global.get("accountingRules");
  
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
  
  global.set("accountingRules", mergeSort(accountingRules));
  
  return msg;
}

module.exports = Node;