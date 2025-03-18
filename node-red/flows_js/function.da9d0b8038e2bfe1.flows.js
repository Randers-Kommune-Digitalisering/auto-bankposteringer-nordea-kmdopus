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
  "x": 665,
  "y": 60,
  "wires": [
    [
      "c49c5be7601cebc5"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpObj = global.get("erp");
  let transactionsObj = global.get("transactions");
  let masterDataObj = global.get("masterData");
  let postings = [];
  let transactionsUnmatched = transactionsObj.unmatched ? transactionsObj.unmatched : [];
  const transactions = transactionsObj.list.reverse();
  const transactionParameters = transactionsObj.parameters;   // Has to match ruleParameters length
  const accountingRules = masterDataObj.rules;
  const ruleParameters = Object.keys(accountingRules[0]).slice(0, 4);
  const date = global.get("dates").simpleDate;
  
  function sumOfParametersGiven(rule) {
      // Count the number of rule parameters where the value property is defined (truthy)
      return Object.keys(rule)
          .slice(0, 4)
          .filter(key => rule[key] || rule[key] || rule[key]).length;
  }
  
  function matchParameter(transaction, searchValue, key) {
      return transaction[key] ? transaction[key].toLowerCase().includes(searchValue) : false;
  }
  
  function matchAmount(transactionAmount, amountOperator, ruleAmount1, ruleAmount2) {
      switch (ruleAmount1) {
          case null:
              break;
          default:
              ruleAmount1 = parseFloat(ruleAmount1.replace(/\./g, '').replace(',', '.'));
              break;
      }
  
      switch (ruleAmount2) {
          case null:
              break;
          default:
              ruleAmount2 = parseFloat(ruleAmount2.replace(/\./g, '').replace(',', '.'));
              break;
      }
      
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
      textVariation = textVariation ? textVariation : "";
  
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
  
  function generatePostings(statusAccount, landingAccount, statusDebetOrCredit, landingDebetOrCredit, text, amount, psp) {
      postings.push(
          {
              account: statusAccount,
              debetOrCredit: statusDebetOrCredit,
              amount: amount,
              text: text
          }
      )
      postings.push(
          {
              account: landingAccount,
              psp: psp,
              debetOrCredit: landingDebetOrCredit,
              amount: amount,
              text: text
          }
      )
  }
  
  
  function processPosting(transaction, rules) {
      let absoluteAmount = Math.abs(parseFloat(transaction.amount));
      let cleanedAmount = absoluteAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      transaction.amount = cleanedAmount;
      let statusDebetOrCredit = transaction.amount > 0 ? "Debet" : "Kredit";
      let landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet";
      
      if (transaction.account.manual) {
          generatePostings(transaction.account.statusAccount, transaction.account.Artskonto, statusDebetOrCredit, landingDebetOrCredit, transaction.account.text, cleanedAmount, transaction.account.PSP);
      } else {
          let completeMatch = false;
  
          for (let rule of rules) {      
              let sumOfParametersMatched = 0;
              let psp = rule.PSP ? rule.PSP : '';
  
              if (completeMatch) {
                  continue
              } else {
                  for (let parameterIndex = 0; parameterIndex < transactionParameters.length; parameterIndex++) {
                      let searchValue = rule[ruleParameters[parameterIndex]] ? rule[ruleParameters[parameterIndex]].toLowerCase() : null;
  
                      if (searchValue && rule.ActiveBool && matchParameter(transaction, searchValue, transactionParameters[parameterIndex])) {
  
                          sumOfParametersMatched += 1;
                      }
                  }
  
                  let matchedAllParametersBool = sumOfParametersMatched === sumOfParametersGiven(rule);
                  let matchedAmountBool = matchAmount(absoluteAmount, rule.Operator, rule.Beløb1, rule.Beløb2)
                  let matchedAccountBool = transaction.account.bankAccount === rule.relatedBankAccount
  
                  if (matchedAllParametersBool && matchedAmountBool && matchedAccountBool) {
                      if (!rule.ExceptionBool) {   // Don't write ERP postings if rule is an exception, but still count as match
                          let text = textGeneration(rule.Posteringstekst, transaction.message, transaction.narrative, transaction.counterparty_name);
                          generatePostings(transaction.account.statusAccount, rule.Artskonto, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, psp);
                      }
                      completeMatch = true;
                      rule.LastUsed = date;
                  }
              }
          }
          if (!completeMatch) {
              let text = transaction.transaction_id;
  
              generatePostings(transaction.account.statusAccount, transaction.account.intermediateAccount, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, '');
              
              // if (transaction.account.bankAccountName != "Debitorkonto") {
              if (transaction.account.bankAccountName != "TEST") {
                  transactionsUnmatched.push(transaction);
              }
          }
  
          transactionsObj.unmatched = transactionsUnmatched;
          global.set("transactions", transactionsObj);
  
      }   
      
  }
  
  transactions.forEach(transaction => {
      processPosting(transaction, accountingRules);
  });
  
  erpObj.postings = postings;
  global.set("erp", erpObj);
  
  masterDataObj.rules = accountingRules;
  global.set("masterData", masterDataObj);
  
  return msg;
}

module.exports = Node;