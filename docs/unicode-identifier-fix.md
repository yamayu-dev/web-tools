# Unicode Identifier Issue Fix

## 問題の説明 (Problem Description)

JavaScriptでは、仕様により変数名（識別子）にUnicode文字を使用することが許可されています。
これにより、以下のようなコードが構文エラーにならず実行されてしまいます：

```javascript
varあ = 5;
sum = 0;
console.log(varあ); // 5
console.log(sum);   // 0
```

このコードは、一見すると `var sum = 0;` のようなタイプミスに見えますが、
実際には `varあ` という名前の変数を作成しています。

### なぜこれが問題か

1. **意図が不明瞭**: `varあ` が変数名なのか、`var` キーワードの後に日本語が続いているのか区別しにくい
2. **デバッグが困難**: タイプミスと実際の変数名の区別がつきにくい
3. **可読性の低下**: ASCII文字以外の識別子は、多くの開発環境で適切に表示されない可能性がある

## 修正内容 (Fix Details)

ESLintの `id-match` ルールを追加して、識別子をASCII文字のみに制限しました。

### 変更されたファイル

- `eslint.config.js`: 新しい `id-match` ルールを追加

### ルールの詳細

```javascript
'id-match': ['error', '^[a-zA-Z0-9_$]+$', {
  properties: true,
  classFields: true,
  onlyDeclarations: false,
}]
```

このルールは以下を実施します：

- **許可される文字**: 英字（a-z, A-Z）、数字（0-9）、アンダースコア（_）、ドル記号（$）
- **適用範囲**: 
  - すべての変数宣言
  - プロパティ名
  - クラスフィールド名
  - 変数の使用（宣言だけでなく）

## 修正後の動作

### TypeScriptファイル (.ts, .tsx)

TypeScriptのパーサーが構文エラーとして検出します：

```
error  Parsing error: Unknown keyword or identifier. Did you mean 'var'?
```

### JavaScriptファイル (.js, .jsx)

ESLintの `id-match` ルールがエラーとして検出します：

```
error  Identifier 'varあ' does not match the pattern '^[a-zA-Z0-9_$]+$'  id-match
```

## 理由の説明 (Technical Explanation)

### ECMAScript仕様とUnicode

ECMAScript仕様では、識別子にUnicode文字を使用することが許可されています。
これは国際化をサポートするための機能ですが、以下のような問題を引き起こす可能性があります：

1. **視覚的な混乱**: 異なるスクリプトの文字が混在すると、コードの可読性が低下
2. **ホモグリフ攻撃**: 見た目が似ている異なる文字を使った攻撃の可能性
3. **ツールの互換性**: すべての開発ツールがUnicode識別子を適切にサポートしているわけではない

### 本プロジェクトでの方針

以下の理由から、識別子をASCII文字のみに制限することにしました：

1. **明確性**: すべての識別子が標準的なキーボードで入力可能
2. **一貫性**: プロジェクト全体で統一されたコーディングスタイル
3. **エラー防止**: タイプミスや混乱を未然に防ぐ
4. **ツールサポート**: すべての開発ツールで確実に動作する

## 参考資料 (References)

- [ECMAScript Language Specification - Identifiers](https://tc39.es/ecma262/#sec-names-and-keywords)
- [ESLint id-match rule](https://eslint.org/docs/latest/rules/id-match)
- [Unicode in JavaScript](https://mathiasbynens.be/notes/javascript-identifiers)
