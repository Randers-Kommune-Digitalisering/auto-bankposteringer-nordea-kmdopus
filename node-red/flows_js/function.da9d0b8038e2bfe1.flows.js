const Node = {
  "id": "da9d0b8038e2bfe1",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "202a6b173abfc606",
  "name": "Match postings with rules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 115,
  "y": 340,
  "wires": [
    [
      "c49c5be7601cebc5"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpArray = flow.get("erpArray") || [];
  const transactions = global.get("transactions");
  const transactionParameters = flow.get("transactionParameters");   // Has to match ruleParameters
  const accountingRules = global.get("accountingRules");
  const ruleParameters = Object.keys(accountingRules[0]).slice(0, 4);
  const erpPostings = [];
  const transactionsWithNoMatch = [];
  const erpFileHeaders = flow.get("erpFileHeaders").split(", ");
  const bankAccounts = global.get("bankAccounts");
  
  function calculateSpecificity(rule) {
      // Count the number of rule parameters where the value property is defined (truthy)
      return Object.keys(rule)
          .slice(0, 2)
          .filter(key => rule[key] || rule[key] || rule[key]).length;
  }
  
  function matchParameter(transaction, searchValue, key) {
      return transaction[key] ? transaction[key].toLowerCase().includes(searchValue) : false;
  }
  
  function matchAmount(transactionAmount, amountOperator, ruleAmount1, ruleAmount2) {
      switch (amountOperator) {
          case '><':
              return transactionAmount >= ruleAmount1 && transactionAmount <= ruleAmount2;
          case '>':
              return transactionAmount > ruleAmount1;
          case '<':
              return transactionAmount < ruleAmount1;
          case '==':
              return transactionAmount === ruleAmount1;
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
  
  function processPosting(transaction, sortedRules) {
      let completeMatchBool = false;
  
      let currentBankAccount = bankAccounts.find(account => account.bankAccount === transaction.account);
  
      let transactionAmount = parseFloat(transaction.amount);
      let cleanedAmount = String(transactionAmount).replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
      let statusDebetOrCredit = transactionAmount > 0 ? "Debet" : "Kredit";
      let landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet"
  
      for (let rule of sortedRules) {      
          let sumOfParametersMatched = 0;
          let psp = rule.PSP ? rule.PSP : '';
          let ruleAmount1 = rule.Beløb1;          // ? parseFloat(rule.Beløb1.replace(',', '.')) : null;
          let ruleAmount2 = rule.Beløb2;          // ? parseFloat(rule.Beløb2.replace(',', '.')) : null;
  
          if (completeMatchBool) {
              continue
          } else {
              for (let parameterIndex = 0; parameterIndex < transactionParameters.length; parameterIndex++) {
                  let searchValue = rule[ruleParameters[parameterIndex]];
  
                  if (searchValue && rule.Active && matchParameter(transaction, searchValue, transactionParameters[parameterIndex])) {
                      sumOfParametersMatched += 1;
                  }
              }
  
              let matchedAllParametersBool = sumOfParametersMatched === calculateSpecificity(rule);
              let matchedAmountBool = matchAmount(transactionAmount, rule.Operator, ruleAmount1, ruleAmount2)
  
              if (matchedAllParametersBool && matchedAmountBool) {
                  if (!rule.Exception) {   // Don't write ERP postings if rule is an exception, but still count as match
                      let text = textGeneration(rule.Posteringstekst, transaction.message, transaction.narrative, transaction.counterparty_name);
                      generateErpPostings(currentBankAccount.statusAccount, rule.Artskonto, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, psp);
                  }
                  completeMatchBool = true;
              }
          }
      }
      if (!completeMatchBool) {
          let text = transaction.transaction_id;
  
          generateErpPostings(currentBankAccount.statusAccount, currentBankAccount.intermediateAccount, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, '');
          transactionsWithNoMatch.push(transaction);
      }
  }
  
  
  transactions.forEach(transaction => {
      processPosting(transaction, accountingRules);
  });
  
  global.set("transactionsWithNoMatch", transactionsWithNoMatch);
  flow.set("erpArray", erpArray.concat(erpPostings));
  
  msg.payload = erpArray.concat(erpPostings);
  msg.columns = flow.get("erpFileHeaders");
  msg.filename = "/data/output/" + global.get("dateOfOrigin") + ".csv";
  
  return msg;
}

module.exports = Node;