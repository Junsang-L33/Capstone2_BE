const SENTENCE_BOUNDARY_REGEX = /[.!?\n]+/;
// 모델서버랑 연결: 웹서버에서 원문을 statement 단위로 분해한 뒤 분류 요청 전 사용
const CLAUSE_CONNECTORS = [
  "하지만",
  "근데",
  "그런데",
  "그래서",
  "그리고",
  "그러니까",
  "반면에",
  "다만",
];

const NEED_PATTERNS = [
  /좋겠어/,
  /좋겠어요/,
  /원해/,
  /원했어/,
  /바라/,
  /필요해/,
  /필요했어/,
  /해줬으면/,
  /했으면/,
  /말아줬으면/,
  /부탁해/,
  /원한다/,
];

const EMOTION_PATTERNS = [
  /화가\s?나/,
  /화났/,
  /서운/,
  /속상/,
  /슬펐/,
  /답답/,
  /불안/,
  /짜증/,
  /억울/,
  /무서웠/,
  /괴로웠/,
  /실망/,
  /섭섭/,
  /기분이\s?(나빴|좋았)/,
  /힘들/,
  /분했/,
];

const INTERPRETATION_PATTERNS = [
  /것\s?같/,
  /거\s?같/,
  /처럼\s?느껴/,
  /라고\s?생각/,
  /줄\s?알/,
  /의도/,
  /무시/,
  /피하/,
  /싫어하/,
  /중요하지\s?않/,
  /거리를\s?두/,
  /의미하는\s?것\s?같/,
  /신경\s?안\s?쓰/,
];

const TINY_FRAGMENT_LENGTH = 3;

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function cleanFragment(text) {
  return normalizeWhitespace(
    text
      .replace(/^[,;:/)\]\s]+/, "")
      .replace(/[,;:/(\[\s]+$/, "")
      .replace(/^["'“”‘’]+|["'“”‘’]+$/g, ""),
  );
}

function dropLeadingConnector(text) {
  const pattern = new RegExp(`^\\s*(${CLAUSE_CONNECTORS.join("|")})\\s+`);
  return cleanFragment(text.replace(pattern, ""));
}

function inferStatementTypeHint(text) {
  if (NEED_PATTERNS.some((pattern) => pattern.test(text))) {
    return "NEED";
  }

  if (EMOTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return "EMOTION";
  }

  if (INTERPRETATION_PATTERNS.some((pattern) => pattern.test(text))) {
    return "INTERPRETATION";
  }

  return "UNKNOWN";
}

function toDeclarative(fragment) {
  const replacements = [
    [/같아서$/, "같아"],
    [/했으니까$/, "했어"],
    [/였으니까$/, "였어"],
    [/었으니까$/, "었어"],
    [/았으니까$/, "았어"],
    [/했는데$/, "했어"],
    [/였는데$/, "였어"],
    [/었는데$/, "었어"],
    [/았는데$/, "았어"],
    [/했고$/, "했어"],
    [/였고$/, "였어"],
    [/었고$/, "었어"],
    [/았고$/, "았어"],
    [/해서$/, "했어"],
    [/여서$/, "였어"],
    [/라서$/, "야"],
    [/아서$/, "았어"],
    [/어서$/, "었어"],
    [/고$/, ""],
  ];

  let result = cleanFragment(fragment);

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }

  return cleanFragment(result);
}

function splitBySentenceBoundaries(text) {
  return text
    .split(SENTENCE_BOUNDARY_REGEX)
    .map(dropLeadingConnector)
    .filter(Boolean);
}

function splitByClauseConnectors(text) {
  const markerPattern = new RegExp(`\\s+(${CLAUSE_CONNECTORS.join("|")})\\s+`, "g");
  return text
    .replace(markerPattern, " |||$1 ")
    .split("|||")
    .map(dropLeadingConnector)
    .filter(Boolean);
}

function splitByComma(text) {
  return text
    .split(",")
    .map(cleanFragment)
    .filter(Boolean);
}

function splitBySemanticSuffix(text) {
  const match = text.match(/^(.+?(?:같아서|했으니까|였으니까|었으니까|았으니까|했는데|였는데|었는데|았는데|했고|였고|었고|았고|해서|여서|라서|아서|어서|고))\s+(.+)$/);

  if (!match) {
    return null;
  }

  const left = toDeclarative(match[1]);
  const right = cleanFragment(match[2]);
  const rightHint = inferStatementTypeHint(right);

  if (
    left.length <= TINY_FRAGMENT_LENGTH ||
    right.length <= TINY_FRAGMENT_LENGTH ||
    rightHint === "UNKNOWN"
  ) {
    return null;
  }

  return [left, right];
}

function recursivelySplit(text, depth = 0) {
  const segment = cleanFragment(text);

  if (!segment) {
    return [];
  }

  if (depth >= 6) {
    return [segment];
  }

  const connectorParts = splitByClauseConnectors(segment);

  if (connectorParts.length > 1) {
    return connectorParts.flatMap((part) => recursivelySplit(part, depth + 1));
  }

  const commaParts = splitByComma(segment);

  if (
    commaParts.length > 1 &&
    commaParts.some((part) => inferStatementTypeHint(part) !== "UNKNOWN")
  ) {
    return commaParts.flatMap((part) => recursivelySplit(part, depth + 1));
  }

  const semanticParts = splitBySemanticSuffix(segment);

  if (semanticParts) {
    return semanticParts.flatMap((part) => recursivelySplit(part, depth + 1));
  }

  return [segment];
}

function mergeTinyFragments(fragments) {
  const merged = [];

  for (const fragment of fragments) {
    if (!fragment) {
      continue;
    }

    if (fragment.length <= TINY_FRAGMENT_LENGTH && merged.length > 0) {
      merged[merged.length - 1] = cleanFragment(`${merged[merged.length - 1]} ${fragment}`);
      continue;
    }

    merged.push(fragment);
  }

  return merged;
}

export function splitIntoStatements(rawText) {
  if (typeof rawText !== "string") {
    return [];
  }

  const normalized = normalizeWhitespace(rawText);

  if (!normalized) {
    return [];
  }

  const baseSegments = splitBySentenceBoundaries(normalized);
  const statements = baseSegments.flatMap((segment) => recursivelySplit(segment));

  return mergeTinyFragments(statements.map(cleanFragment)).filter(Boolean);
}

export function splitStatementsWithHints(rawText) {
  return splitIntoStatements(rawText).map((text, index) => ({
    order: index + 1,
    text,
    hint: inferStatementTypeHint(text),
  }));
}
