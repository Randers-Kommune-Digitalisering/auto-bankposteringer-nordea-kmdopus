const Node = {
  "id": "86f0122c1a507f0c",
  "type": "change",
  "z": "36720db510b259f8",
  "d": true,
  "name": "Checking data against rules backup",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "payload @$p.\t(\t$respectsRule := function($rule, $value)\t{\t    $rule.operator = \"!null\" ?\t        $value != null\t    :\t    $value = null ?\t        false\t    :\t    $rule.operator = \"<\" ?\t        $value < $rule.value\t    :\t    $rule.operator = \">\" ?\t        $value > $rule.value\t    :\t    $rule.operator = \"==\" ?\t        $value = $rule.value\t    :\t    $rule.operator = \"!=\" ?\t        $value != $rule.value\t    :\t    $rule.operator = \"contains\" ?\t        ($contains($string($value), $string($rule.value)))\t    :\t    $rule.operator = \"!contains\" ?\t        ($contains($string($value), $string($rule.value)) ? false : true)\t};\t{\t    \"object\": $p,\t\t    \"rulesChecked\": \t        rules @$r.\t        (\t            $data := $lookup($p, $r.variable);\t            {\t                \"rule\": $r.name,\t                \"description\": $r.description,\t                \"objectValue\": $data,\t                \"operator\": $r.operator,\t                \"expectedValue\": $r.value,\t                \"isRespected\": $respectsRule($r, $data)\t            }\t        ),\t\t    \"rulesBroken\": $rulesBroken :=\t        rules @$r.\t        (\t            $respectsRule($r, $data := $lookup($p, $r.variable)) = false ?\t            {\t                \"rule\": $r.name,\t                \"description\": $r.description,\t                \"objectValue\": $data,\t                \"operator\": $r.operator,\t                \"expectedValue\": $r.value,\t                \"isRespected\": $respectsRule($r, $data)\t            }\t        ),\t\t    \"allRulesRespected\": $rulesBroken ~> $exists() ? false : true\t}\t)",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 280,
  "y": 180,
  "wires": [
    []
  ],
  "_order": 78
}

module.exports = Node;