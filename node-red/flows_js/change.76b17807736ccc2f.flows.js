const Node = {
  "id": "76b17807736ccc2f",
  "type": "change",
  "z": "36720db510b259f8",
  "name": "Checking data against rules",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "payload @$p.\t(\t$asRegex := function($rule)\t{\t    $eval(\"/^f.*\" & $rule.value & \"/\")\t};\t$respectsRule := function($rule, $value)\t{\t    $rule.operator = \"!null\" ?\t        $value != null\t    :\t    $value = null ?\t        false\t    :\t    $rule.operator = \"<\" ?\t        $value < $rule.value\t    :\t    $rule.operator = \">\" ?\t        $value > $rule.value\t    :\t    $rule.operator = \"==\" ?\t        $value = $rule.value\t    :\t    $rule.operator = \"!=\" ?\t        $value != $rule.value\t    :\t    $rule.operator = \"contains\" ?\t        ($contains($string($value), $string($rule.value)) ? true : false)\t    :\t    $rule.operator = \"!contains\" ?\t        ($contains($string($value), $string($rule.value)) ? false : true)\t    :\t    $rule.operator = \"regex\" ?\t        ($match($string($value), $eval(\"/\" & $rule.value & \"/\")) ? true : false)\t};\t{\t    \"inputObject\": $p,\t\t    \"rulesChecked\": $checked :=\t        rules @$r #$i.\t        (\t            $r.name = $p.rule or $i = $p.rule\t            or $r.name in $p.rule or $i in $p.rule ?\t\t            {\t                    \"rule\": $r.name,\t                    \"description\": $r.description,\t                    \"operator\": $r.operator,\t                    \"ruleValue\": $r.value,\t                    \"dataChecked\": \t                        $p.data @$pr #$pi.\t                        (\t                            {\t                                \"dataIndex\": $pi,\t                                \"dataValue\": $pr,\t                                \"isRespected\": $respectsRule($r, $pr)\t                            }\t                        )\t            }\t\t        )\t\t    /*\"rulesPassed\": $checked[isRespected = true],\t    \"rulesBroken\": $checked[isRespected = false]*/\t\t    /*\t    \"rulesBroken\": $rulesBroken :=\t        rules @$r.\t        (\t            $respectsRule($r, $data := $lookup($p, $r.variable)) = false ?\t            {\t                \"rule\": $r.name,\t                \"description\": $r.description,\t                \"objectValue\": $data,\t                \"operator\": $r.operator,\t                \"expectedValue\": $r.value,\t                \"isRespected\": $respectsRule($r, $data)\t            }\t        ),\t    \"allRulesRespected\": $rulesBroken ~> $exists() ? false : true\t*/\t}\t)",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 260,
  "y": 100,
  "wires": [
    []
  ],
  "_order": 76
}

module.exports = Node;