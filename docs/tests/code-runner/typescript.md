# TypeScript コードランナー テスト仕様書

## 概要

TypeScriptコードランナーの機能検証テストケース集です。

## 環境情報

- **言語**: TypeScript
- **実行環境**: ブラウザ内でJavaScriptにトランスパイルして実行
- **利用可能API**: ブラウザAPI、JavaScript標準ライブラリ、Web APIs

---

## テストケース

### TC-TS-001: 基本的な関数定義と呼び出し

**目的**: 関数定義、型アノテーション、文字列補間が正しく動作すること

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("World"));
```

**期待結果**:
```
Hello, World!
```

---

### TC-TS-002: 配列操作とreduce

**目的**: 配列リテラル、reduce関数が正しく動作すること

```typescript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(`Sum: ${sum}`);
```

**期待結果**:
```
Sum: 15
```

---

### TC-TS-003: クラス定義とインスタンス化

**目的**: クラス定義、コンストラクタ、メソッドが正しく動作すること

```typescript
class Person {
  constructor(public name: string, private age: number) {}
  
  introduce(): string {
    return `私は${this.name}、${this.age}歳です`;
  }
}

const person = new Person("太郎", 25);
console.log(person.introduce());
```

**期待結果**:
```
私は太郎、25歳です
```

---

### TC-TS-004: 非同期処理（Promise）

**目的**: async/awaitパターンが正しく動作すること

```typescript
async function fetchData(): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => resolve("データ取得完了"), 100);
  });
}

(async () => {
  const result = await fetchData();
  console.log(result);
})();
```

**期待結果**:
```
データ取得完了
```

---

### TC-TS-005: オブジェクトの分割代入

**目的**: 分割代入が正しく動作すること

```typescript
const user = { name: "花子", email: "hanako@example.com", age: 30 };
const { name, email } = user;
console.log(`Name: ${name}, Email: ${email}`);
```

**期待結果**:
```
Name: 花子, Email: hanako@example.com
```

---

### TC-TS-006: Map/Filterの使用

**目的**: 配列の高階関数が正しく動作すること

```typescript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evenDoubled = numbers
  .filter(n => n % 2 === 0)
  .map(n => n * 2);
console.log(evenDoubled);
```

**期待結果**:
```
[4, 8, 12, 16, 20]
```

---

### TC-TS-007: インターフェース定義

**目的**: インターフェースを使用した型定義が動作すること

```typescript
interface Point {
  x: number;
  y: number;
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

const a: Point = { x: 0, y: 0 };
const b: Point = { x: 3, y: 4 };
console.log(`Distance: ${distance(a, b)}`);
```

**期待結果**:
```
Distance: 5
```

---

## 制限事項

- npmパッケージのimportは不可
- Node.js専用API（fs, path等）は使用不可
- モジュールシステムは未実装
