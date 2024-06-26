const Node = {
  "id": "d2f0332d4c53f8b6",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "Match postings with rules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 325,
  "y": 160,
  "wires": [
    [
      "4255d18a1fe6c5d1"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpArray = flow.get("erpArray") || [];
  const postingParameters = ["message", "narrative", "counterparty_name", "type_description", "end_to_end_reference"];   // Length has to be equal to length of parameter subrules of rules[i]
  const postings = global.get("transactions");
  const konteringsregler = global.get("konteringsregler");
  const erpPostings = [];
  const postingsWithNoMatch = [];
  const erpFileHeaders = flow.get("erpFileHeaders").split(", ");
  const currentAccount = global.get("bankkonti")[global.get("accountStep")];
  const currentStatusAccount = global.get("statuskonti")[global.get("accountStep")];
  const currentLandingAccount = global.get("mellemregningskonti")[global.get("accountStep")];
  
  function calculateSpecificity(rule) {
      // For sorting rules, prioritizing rules by amount of parameters/keys given
      return Object.keys(rule)
          .map(key => parseInt(key, 10))
          .sort((a, b) => a - b)
          .map(key => rule[key])
          .slice(0, 6)
          .filter(entry => entry.value).length;
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
      return posting[parameterKey] ? posting[parameterKey].toLowerCase().includes(searchValue) : false;
  }
  
  function matchAmount(postingAmount, amountOperator, ruleAmount1, ruleAmount2) {
      switch (amountOperator) {
          case '><':
              return postingAmount >= ruleAmount1 && postingAmount <= ruleAmount2;
          case '>':
              return postingAmount > ruleAmount1;
          case '<':
              return postingAmount < ruleAmount1;
          case '==':
              return postingAmount === ruleAmount1;
          default:
              return true;
      }
  }
  
  function textGeneration(textVariation, message, narrative, counterparty_name) {
      if (narrative && narrative.includes('BDP')) {
          return narrative.substring(narrative.indexOf('BDP'));
      } else if (narrative && narrative.includes('KSD')) {
          return narrative.substring(narrative.indexOf('KSD')) + (counterparty_name ? counterparty_name : '');
      }
  
      switch (textVariation) {
          case "tekst fra bank":
              return message;
          case "afsender fra bank":
              return counterparty_name || message;
          case "advis fra bank":
              return narrative || message;
          default:
              return message;
      }
  }
  
  function generateErpPostings(statusAccount, landingAccount, statusDebetOrCredit, bookDebetOrCredit, text, amount, psp) {
      erpPostings.push([landingAccount, '', psp, '', '', bookDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      erpPostings.push([statusAccount, '', '', '', '', statusDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  function processPosting(posting, sortedRules, currentStatusAccount, currentLandingAccount) {
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
          let text = posting.transaction_id;
  
          generateErpPostings(currentStatusAccount, currentLandingAccount, statusDebetOrCredit, bookDebetOrCredit, text, cleanedAmount, '');
          postingsWithNoMatch.push(posting);
          sumOfErpPostings += 1;
      }
  }
  
  if (currentAccount === "DK3620009035615315-DKK") {
      postings.forEach(posting => {
          let statusDebetOrCredit = posting.amount.startsWith('-') ? 'Kredit' : 'Debet';
          let bookDebetOrCredit = statusDebetOrCredit === 'Debet' ? 'Kredit' : 'Debet';
          let cleanedAmount = posting.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
          let text = posting.counterparty_name + " - " + posting.narrative;
  
          generateErpPostings(currentStatusAccount, currentLandingAccount, statusDebetOrCredit, bookDebetOrCredit, text, cleanedAmount, '');
      });
  
      flow.set("erp_array", erpArray.concat(erpPostings));
  } else {
      postings.forEach(posting => {
          processPosting(posting, mergeSort(konteringsregler), currentStatusAccount, currentLandingAccount);
      });
  }
  
  global.set("postingsWithNoMatch", postingsWithNoMatch);
  flow.set("erpArray", erpArray.concat(erpPostings));
  
  msg.payload = erpArray.concat(erpPostings);
  msg.columns = global.get("erpFileHeaders");
  msg.filename = "/data/output/" + global.get("time_of_origin") + ".csv";
  
  return msg;
}

module.exports = Node;