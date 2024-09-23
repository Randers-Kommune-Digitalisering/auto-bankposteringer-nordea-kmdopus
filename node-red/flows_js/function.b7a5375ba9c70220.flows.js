const Node = {
  "id": "b7a5375ba9c70220",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "fafde89af20cbe51",
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
      "98b1709c5174f90d",
      "e176ace9d52ca574"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpArray = flow.get("erpArray") || [];
  const postingParameters = ["narrative", "message", "counterparty_name", "type_description"];   // Has to match ruleParameters
  const ruleParameters = ["Reference", "Advisliste", "Afsender", "Posteringstype"];
  const postings = global.get("transactions");
  const accountingRules = global.get("accountingRules");
  const erpPostings = [];
  const postingsWithNoMatch = [];
  const erpFileHeaders = flow.get("erpFileHeaders").split(", ");
  const currentBankAccount = global.get("bankAccounts")[global.get("accountStep")].bankAccount;
  const currentStatusAccount = global.get("statusAccounts")[global.get("accountStep")].statusAccount;
  const currentIntermediateAccount = global.get("intermediateAccounts")[global.get("accountStep")].intermediateAccount;
  
  function calculateSpecificity(rule) {
      // Count the number of rule parameters where the value property is defined (truthy)
      return Object.keys(rule)
          .slice(0, 2)
          .filter(key => rule[key] || rule[key] || rule[key]).length;
  }
  
  function matchParameter(posting, searchValue, key) {
      return posting[key] ? posting[key].toLowerCase().includes(searchValue) : false;
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
  
      switch (textVariation.toLowerCase()) {
          case "tekst fra bank":
              return narrative;
          case "afsender fra bank":
              return counterparty_name || message;
          case "advis fra bank":
              return message || narrative;
          default:
              return textVariation;
      }
  }
  
  function generateErpPostings(statusAccount, landingAccount, statusDebetOrCredit, landingDebetOrCredit, text, amount, psp) {
      erpPostings.push([landingAccount, '', psp, '', '', landingDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      erpPostings.push([statusAccount, '', '', '', '', statusDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  function processPosting(posting, sortedRules, currentStatusAccount, currentIntermediateAccount) {
      let completeMatchBool = false;
  
      let postingAmount = parseFloat(posting.amount);
      let cleanedAmount = String(postingAmount).replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
      let statusDebetOrCredit = postingAmount > 0 ? "Debet" : "Kredit";
      let landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet"
  
      for (let rule of sortedRules) {      
          let sumOfParametersMatched = 0;
          let psp = rule.PSP ? rule.PSP : '';
          let ruleAmount1 = rule.Beløb1; // ? parseFloat(rule.Beløb1.replace(',', '.')) : null;
          let ruleAmount2 = rule.Beløb2; // ? parseFloat(rule.Beløb2.replace(',', '.')) : null;
  
          if (completeMatchBool) {
              continue
          } else {
              for (let parameterIndex = 0; parameterIndex < postingParameters.length; parameterIndex++) {
                  let searchValue = rule[ruleParameters[parameterIndex]];
  
                  if (searchValue && rule.Active && matchParameter(posting, searchValue, postingParameters[parameterIndex])) {
                      sumOfParametersMatched += 1;
                  }
              }
  
              let matchedAllParametersBool = sumOfParametersMatched === calculateSpecificity(rule);
              let matchedAmountBool = matchAmount(postingAmount, rule.Operator, ruleAmount1, ruleAmount2)
  
              if (matchedAllParametersBool && matchedAmountBool) {
                  if (!rule.Exception) {   // Don't write ERP postings if rule is an exception, but still count as match
                      let text = textGeneration(rule.Posteringstekst, posting.message, posting.narrative, posting.counterparty_name);
                      generateErpPostings(currentStatusAccount, rule.Artskonto, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, psp);
                  }
                  completeMatchBool = true;
              }
          }
      }
      if (!completeMatchBool) {
          let text = posting.transaction_id;
  
          generateErpPostings(currentStatusAccount, currentIntermediateAccount, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, '');
          postingsWithNoMatch.push(posting);
      }
  }
  
  // Special rule. If/else statement should be removed in public repo.
  if (currentBankAccount === "DK3620009035615315-DKK") {
      postings.forEach(posting => {
          let statusDebetOrCredit = posting.amount.startsWith('-') ? 'Kredit' : 'Debet';
          let landingDebetOrCredit = statusDebetOrCredit === 'Debet' ? 'Kredit' : 'Debet';
          let cleanedAmount = posting.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
          let text = posting.counterparty_name + " - " + posting.narrative;
  
          generateErpPostings(currentStatusAccount, currentIntermediateAccount, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, '');
      });
  
  } else {
      postings.forEach(posting => {
          processPosting(posting, accountingRules, currentStatusAccount, currentIntermediateAccount);
      });
  }
  
  global.set("postingsWithNoMatch", postingsWithNoMatch);
  flow.set("erpArray", erpArray.concat(erpPostings));
  
  msg.payload = erpArray.concat(erpPostings);
  msg.columns = flow.get("erpFileHeaders");
  msg.filename = "/data/output/" + global.get("dateOfOrigin") + ".csv";
  
  return msg;
}

module.exports = Node;