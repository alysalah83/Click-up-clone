/**
 * Custom field formulas: a tiny safe expression evaluator (no eval / Function), shared by the API
 * (validation) and the web app (computed on read, previewed in the add-field dialog). This file has no
 * imports, so the web imports it directly by path.
 *
 * Syntax: numbers, + - * / and parentheses, the task built-in `points`, and number or progress
 * fields of the list by name in braces: `points * 2`, `{Estimate (h)} - {Actual (h)}`.
 */

/** Field types a formula may reference (by `{Name}`), besides the task built-ins. */
export const FORMULA_REFERENCE_TYPES: readonly string[] = ["number", "progress"];
/** Task values a formula may reference by bare name. */
export const FORMULA_BUILTINS = ["points"] as const;

/** The parts of a custom field a formula needs. */
export interface FormulaField {
  id: string;
  name: string;
  type: string;
}

// Grammar (no eval / Function):  expr := term (('+'|'-') term)* · term := unary (('*'|'/') unary)*
// unary := '-' unary | primary · primary := number | '{Field name}' | builtin | '(' expr ')'

type Token =
  | { kind: "num"; value: number }
  | { kind: "ref"; name: string }
  | { kind: "op"; op: "+" | "-" | "*" | "/" | "(" | ")" };

export type FormulaNode =
  | { kind: "num"; value: number }
  | { kind: "ref"; name: string }
  | { kind: "neg"; arg: FormulaNode }
  | { kind: "bin"; op: "+" | "-" | "*" | "/"; left: FormulaNode; right: FormulaNode };

class FormulaError extends Error {}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/\s/.test(ch)) {
      i++;
    } else if ("+-*/()".includes(ch)) {
      tokens.push({ kind: "op", op: ch as "+" });
      i++;
    } else if (/[0-9.]/.test(ch)) {
      const match = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i));
      if (!match) throw new FormulaError(`Unexpected "${ch}"`);
      tokens.push({ kind: "num", value: Number(match[0]) });
      i += match[0].length;
    } else if (ch === "{") {
      const end = src.indexOf("}", i);
      if (end === -1) throw new FormulaError("Missing }");
      const name = src.slice(i + 1, end).trim();
      if (!name) throw new FormulaError("Empty field name {}");
      tokens.push({ kind: "ref", name });
      i = end + 1;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))!;
      tokens.push({ kind: "ref", name: match[0] });
      i += match[0].length;
    } else {
      throw new FormulaError(`Unexpected "${ch}"`);
    }
  }
  return tokens;
}

/** Parses a formula; throws nothing. */
export function parseFormula(expression: string): { ok: true; ast: FormulaNode; refs: string[] } | { ok: false; error: string } {
  try {
    const tokens = tokenize(expression);
    if (tokens.length === 0) return { ok: false, error: "Formula is empty" };
    let pos = 0;
    const peek = () => tokens[pos];
    const isOp = (op: string) => {
      const t = peek();
      return t?.kind === "op" && t.op === op;
    };
    const refs = new Set<string>();

    const primary = (): FormulaNode => {
      const t = tokens[pos++];
      if (!t) throw new FormulaError("Formula ends too early");
      if (t.kind === "num") return t;
      if (t.kind === "ref") {
        refs.add(t.name);
        return t;
      }
      if (t.op === "(") {
        const inner = expr();
        if (!isOp(")")) throw new FormulaError("Missing )");
        pos++;
        return inner;
      }
      throw new FormulaError(`Unexpected "${t.op}"`);
    };
    const unary = (): FormulaNode => {
      if (isOp("-")) {
        pos++;
        return { kind: "neg", arg: unary() };
      }
      if (isOp("+")) {
        pos++;
        return unary();
      }
      return primary();
    };
    const term = (): FormulaNode => {
      let left = unary();
      while (isOp("*") || isOp("/")) {
        const op = (tokens[pos++] as { op: "*" | "/" }).op;
        left = { kind: "bin", op, left, right: unary() };
      }
      return left;
    };
    const expr = (): FormulaNode => {
      let left = term();
      while (isOp("+") || isOp("-")) {
        const op = (tokens[pos++] as { op: "+" | "-" }).op;
        left = { kind: "bin", op, left, right: term() };
      }
      return left;
    };

    const ast = expr();
    if (pos < tokens.length) {
      const t = tokens[pos]!;
      throw new FormulaError(`Unexpected "${t.kind === "op" ? t.op : t.kind === "num" ? t.value : t.name}"`);
    }
    return { ok: true, ast, refs: [...refs] };
  } catch (error) {
    if (error instanceof FormulaError) return { ok: false, error: error.message };
    throw error;
  }
}

export type FormulaResult = { ok: true; value: number | null } | { ok: false; error: string };

/**
 * Evaluates a formula. `resolve` returns a reference's number, `null` when the task has no
 * value (the result is then empty), or `undefined` for an unknown reference (an error).
 */
export function evaluateFormula(expression: string, resolve: (name: string) => number | null | undefined): FormulaResult {
  const parsed = parseFormula(expression);
  if (!parsed.ok) return parsed;
  try {
    const run = (node: FormulaNode): number | null => {
      switch (node.kind) {
        case "num":
          return node.value;
        case "ref": {
          const value = resolve(node.name);
          if (value === undefined) throw new FormulaError(`Unknown field "${node.name}"`);
          return value;
        }
        case "neg": {
          const v = run(node.arg);
          return v === null ? null : -v;
        }
        case "bin": {
          const l = run(node.left);
          const r = run(node.right);
          if (l === null || r === null) return null;
          if (node.op === "+") return l + r;
          if (node.op === "-") return l - r;
          if (node.op === "*") return l * r;
          if (r === 0) throw new FormulaError("Division by zero");
          return l / r;
        }
      }
    };
    const value = run(parsed.ast);
    if (value !== null && !Number.isFinite(value)) return { ok: false, error: "Result is not a number" };
    return { ok: true, value: value === null ? null : Math.round(value * 1e6) / 1e6 };
  } catch (error) {
    if (error instanceof FormulaError) return { ok: false, error: error.message };
    throw error;
  }
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The fields of the list a formula can see: number and progress fields. */
function referenceField(fields: FormulaField[], name: string) {
  return fields.find((f) => FORMULA_REFERENCE_TYPES.includes(f.type) && sameName(f.name, name));
}

/** Checks a formula against the list's fields (syntax and references); `null` when valid. */
export function validateFormula(expression: string, fields: FormulaField[]): string | null {
  const parsed = parseFormula(expression);
  if (!parsed.ok) return parsed.error;
  for (const ref of parsed.refs) {
    if ((FORMULA_BUILTINS as readonly string[]).includes(ref.toLowerCase())) continue;
    if (!referenceField(fields, ref)) return `Unknown field "${ref}" (use a number or progress field, or points)`;
  }
  return null;
}

/** The task data a formula reads. */
export interface FormulaTask {
  points?: number | null;
  customFields?: Record<string, unknown>;
}

/** The value of a formula field for one task. */
export function computeFormula(
  field: { config: { expression?: string } },
  task: FormulaTask,
  fields: FormulaField[],
): FormulaResult {
  return evaluateFormula(field.config.expression ?? "", (name) => {
    if (sameName(name, "points")) return task.points ?? null;
    const ref = referenceField(fields, name);
    if (!ref) return undefined;
    const value = task.customFields?.[ref.id];
    return typeof value === "number" ? value : null;
  });
}
