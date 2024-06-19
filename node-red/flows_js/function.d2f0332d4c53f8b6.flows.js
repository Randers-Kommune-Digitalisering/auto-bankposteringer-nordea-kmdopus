const Node = {
  "id": "d2f0332d4c53f8b6",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "Matching",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 200,
  "y": 60,
  "wires": [
    [
      "4255d18a1fe6c5d1"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let sumOfPostingsWithNoMatch = 0;
  let erpArray = flow.get("erp_array") || [];
  const postingParameters = ["message", "narrative", "counterparty_name", "type_description", "end_to_end_reference"];   // Length has to be equal to length of parameter subrules of rules[i]
  const erpPostings = [];
  const postingsWithNoMatch = [];
  const erpFileHeaders = flow.get("erp_file_headers").split(", ");
  const currentAccount = global.get("bankkonti")[global.get("account_step")];
  const currentStatusAccount = global.get("statuskonti")[global.get("account_step")];
  const currentLandingAccount = global.get("mellemregningskonti")[global.get("account_step")];
  
  function calculateSpecificity(rule) {
      // Count the number of filled parameters in the rule
      const ruleArray = Object.keys(rule)                         // Convert rule object to string
                              .map(key => parseInt(key, 10))      // Convert keys to integers
                              .sort((a, b) => a - b)              // Sort numerically
                              .map(key => rule[key]);             // Map back to values
      return ruleArray.slice(0, 6).filter(entry => entry.value).length;
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
  
  function matchParameter(posting, searchValue, parameterKey) {
      if (posting[parameterKey]) {
          return posting[parameterKey].toLowerCase().includes(searchValue);
      } else {
          return false;
      }
  }
  
  function matchAmount(postingAmount, amountOperator, ruleAmount1, ruleAmount2) {
      if (amountOperator === '><') {
          return postingAmount >= ruleAmount1 && postingAmount <= ruleAmount2;
      } else if (amountOperator === '>') {
          return postingAmount > ruleAmount1;
      } else if (amountOperator === '<') {
          return postingAmount < ruleAmount1;
      } else if (amountOperator === '==') {
          return postingAmount === ruleAmount1;
      } else if (!amountOperator) { return true; } else if (!ruleAmount1) { return true; }
  }
  
  function textGeneration(textVariation, message, narrative, counterparty_name) {
      if (narrative && narrative.includes('BDP')) {
          return narrative.substring(narrative.indexOf('BDP'));
      } else if (narrative && narrative.includes('KSD')) {
          return narrative.substring(narrative.indexOf('KSD')) + (counterparty_name ? counterparty_name : '');
      }
  
      if (textVariation === "tekst fra bank") {
          return message;
      } else if (textVariation === "afsender fra bank") {
          return counterparty_name ? counterparty_name : message;
      } else if (textVariation === "advis fra bank") {
          return narrative ? narrative : message;
      } else {
          return message;
      }
  }
  
  function generateErpPostings(statusAccount, landingAccount, statusDebetOrCredit, bookDebetOrCredit, text, amount, psp) {
      erpPostings.push([landingAccount, '', psp, '', '', bookDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      erpPostings.push([statusAccount, '', '', '', '', statusDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  const sortedRules = mergeSort(global.get("konteringsregler"));
  
  if (currentAccount === "DK3620009035615315-DKK") {   // Debitorkonto
      // For hver transaktion
      for (let posting of global.get("transactions")) {
          let statusDebetOrCredit = posting.amount.startsWith('-') ? 'Kredit' : 'Debet';
          let bookDebetOrCredit = statusDebetOrCredit === 'Debet' ? 'Kredit' : 'Debet';
          let cleanedAmount = posting.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
          let text = posting.counterparty_name + " - " + posting.narrative;
  
          generateErpPostings(currentStatusAccount, currentLandingAccount, statusDebetOrCredit, bookDebetOrCredit, text, cleanedAmount, '');
      }
  
      // Concatenate erpPostings to erp_array
      flow.set("erp_array", erpArray.concat(erpPostings));
  
  } else {
      for (let posting of global.get("transactions")) {
          let sumOfErpPostings = 0;
          let sumOfRulesChecked = 0;
          let matchedAllParametersBool = false;
  
          let postingAmount = parseFloat(posting.amount);
          let cleanedAmount = String(postingAmount).replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
          let statusDebetOrCredit = postingAmount > 0 ? "Debet" : "Kredit";
          let bookDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet"
  
          for (let rule of sortedRules) {
              let matches = 0;
  
              let artskonto = rule[6].Artskonto;
              let psp = rule[6].PSP ? rule[6].PSP : '';
              let textVariation = rule[6].Posteringstekst?.toLowerCase() ? rule[6].Posteringstekst.toLowerCase() : undefined;
              let exceptionBool = rule[9].exception;
              let amountOperator = rule[5].operator;
              let ruleAmount1 = rule[5]?.value1 ? parseFloat(rule[5].value1.replace(',', '.')) : undefined;
              let ruleAmount2 = rule[5]?.value2 ? parseFloat(rule[5].value2.replace(',', '.')) : undefined;
  
              if (sumOfRulesChecked > 1 && sumOfErpPostings > 0) {
                  continue
              } else {
                  for (let i = 0; i < postingParameters.length; i++) {
                      let searchValue = rule[i]?.value ? String(rule[i].value).toLowerCase() : null;
  
                      if (searchValue !== null && rule[7].active && matchParameter(posting, searchValue, postingParameters[i])) {
                          matches += 1;
                          break
                      }
                  }
  
                  if (matches === calculateSpecificity(rule)) {
                      matchedAllParametersBool = true;
                  }
  
                  let matchedAmountBool = matchAmount(postingAmount, amountOperator, ruleAmount1, ruleAmount2)
  
                  if (matchedAllParametersBool && matchedAmountBool) {
                      if (!exceptionBool) {   // Don't write ERP postings if rule is an exception
                          let text = textGeneration(textVariation, posting.message, posting.narrative, posting.counterparty_name);
  
                          generateErpPostings(currentStatusAccount, artskonto, statusDebetOrCredit, bookDebetOrCredit, text, cleanedAmount, psp);
                      }
  
                      sumOfErpPostings += 1;
                  }
              }
  
              sumOfRulesChecked += 1;
          }
  
          if (sumOfErpPostings === 0) {
              sumOfPostingsWithNoMatch += 1;
              let text = posting.transaction_id;
  
              generateErpPostings(currentStatusAccount, currentLandingAccount, statusDebetOrCredit, bookDebetOrCredit, text, cleanedAmount, '');
  
              postingsWithNoMatch.push(posting);
              sumOfErpPostings += 1;
          }
      }
  }
  
  flow.set("erp_array", erpArray.concat(erpPostings));
  global.set("postings_with_no_match", postingsWithNoMatch);
  console.log("I alt " + sumOfPostingsWithNoMatch + " uplacerbare poster");
  flow.set("filename", "/data/output/" + global.get("time_of_origin") + ".csv");
  
  return msg;
}

module.exports = Node;