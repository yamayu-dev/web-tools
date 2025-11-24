# CodeRunner テスト結果

## テスト実施日時
2025-11-24

## テスト対象
CodeRunner コンポーネントの修正内容
- ダークモード時の言語選択ドロップダウンのスタイリング
- TypeScript型アノテーション削除機能
- C# bool値出力のサンプルコード

## テストケース

### 1. TypeScript - 基本的な型アノテーション

#### テストコード
```typescript
// TypeScriptコード例
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("World"));

// 簡単な計算
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(`Sum: ${sum}`);
```

#### 実行結果
```
Hello, World!
Sum: 15
```

#### ステータス
✅ **成功** - 関数の型アノテーションとアロー関数が正しく動作

---

### 2. TypeScript - エスケープ文字と複雑な型

#### テストコード
```typescript
// TypeScript with escaped quotes and complex types
const message: string = "He said: \"Hello\"";
const quote: string = 'It\'s working!';

interface User {
  name: string;
  age: number;
}

const users: User[] = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 }
];

const getNames = (users: User[]): string[] => {
  return users.map((user: User) => user.name);
};

console.log(message);
console.log(quote);
console.log(getNames(users));
```

#### 実行結果
```
He said: "Hello"
It's working!
[ "Alice", "Bob" ]
```

#### ステータス
✅ **成功** - エスケープされた引用符が正しく保持され、interface定義、配列型、アロー関数の型アノテーションがすべて正しく処理される

---

### 3. C# - LINQ と bool値の .ToString() 変換

#### テストコード
```csharp
// C#コード例
using System;
using System.Linq;

class Program
{
    static void Main()
    {
        Console.WriteLine(Greet("World"));
        
        // 簡単な計算
        int[] numbers = { 1, 2, 3, 4, 5 };
        int sum = 0;
        foreach (int num in numbers)
        {
            sum += num;
        }
        Console.WriteLine($"Sum: {sum}");
        
        // LINQ の例 - Console.WriteLine(bool) は使えないため .ToString() を使用
        Console.WriteLine($"Any > 3: {numbers.Any(n => n > 3).ToString()}");
        Console.WriteLine($"All < 10: {numbers.All(n => n < 10).ToString()}");
        Console.WriteLine($"Contains 3: {numbers.Contains(3).ToString()}");
    }
    
    static string Greet(string name)
    {
        return $"Hello, {name}!";
    }
}
```

#### 実行結果
```
Hello, World!
Sum: 15
Any > 3: True
All < 10: True
Contains 3: True
```

#### ステータス
✅ **成功** - ローカルビルドしたWASMファイルを使用してC#コードが正常に実行された

**実行環境**:
- 本番ビルド（`npm run build` で生成）
- ローカルでビルドしたWASMファイル（`./scripts/build-csharp-wasm.sh` を使用）
- Vite preview サーバーで実行

**検証済みの内容**:
- ✅ C# WASM ランタイムが正常に初期化される
- ✅ LINQ メソッド（`Any()`, `All()`, `Contains()`）が正しく動作する
- ✅ `.ToString()` による bool 値の文字列変換が正しく機能する
- ✅ コメントで制限事項が説明されている
- ✅ 実行結果が期待値と一致する

---

### 4. ダークモード - 言語選択ドロップダウン

#### テスト内容
1. ライトモードで言語選択ドロップダウンを表示
2. ダークモードに切り替え
3. ドロップダウンのスタイリングを確認
4. ページをリロード
5. ダークモードでドロップダウンのスタイリングを再確認

#### 確認項目
- ✅ ドロップダウンの背景色がダークモードに適応
- ✅ ドロップダウンのテキスト色がダークモードに適応
- ✅ オプション要素の背景色がダークモードに適応
- ✅ オプション要素のテキスト色がダークモードに適応
- ✅ Chakra UI の `Box` コンポーネントを使用
- ✅ `colorScheme` プロパティが正しく設定されている

#### ステータス
✅ **成功** - ダークモードでドロップダウンが正しくスタイリングされる

---

## 修正内容の検証

### 1. ダークモードドロップダウン修正
**変更内容**:
- `<select>` をインラインスタイルから Chakra UI の `<Box as="select">` コンポーネントに変更
- `key={colorMode}` プロパティを削除（不要な再マウントを防止）
- `colorScheme` と CSS でオプション要素のダークモードスタイリングを追加

**検証結果**: ✅ 期待通りに動作

### 2. TypeScript型アノテーション削除の改善
**変更内容**:
- 文字列リテラル保護を追加（エスケープされた引用符を正しく処理）
- 改善された正規表現パターン:
  - 関数戻り値型: `): Type {` または `): Type =>`
  - 関数パラメータ型: `(a: Type, b: Type)`
  - 変数宣言型: `const x: Type = ...`
- テンプレート文字列とエスケープされた引用符を保護

**検証結果**: ✅ すべてのテストケースで期待通りに動作

### 3. C# bool値出力処理
**変更内容**:
- C# サンプルコードに LINQ の例を追加（`.ToString()` 変換付き）
- 制限事項を説明するコメントを追加
- ヘルプダイアログに `Console.WriteLine(bool)` の制限を文書化

**検証結果**: ✅ ローカルビルド環境で C# コードの実行テストが成功し、LINQ メソッドと `.ToString()` による bool 値変換が正しく動作することを確認

---

## 総合評価

### 実行テストが成功したもの
- ✅ TypeScript基本的な型アノテーション
- ✅ TypeScriptエスケープ文字と複雑な型
- ✅ ダークモード言語選択ドロップダウン
- ✅ C# LINQとbool値変換（ローカルビルド環境で実行テスト完了）

### 失敗したテスト
なし

### 備考
- **C# WebAssemblyランタイム**: ローカルビルドスクリプト（`./scripts/build-csharp-wasm.sh`）を使用してWASMファイルをビルドし、本番ビルド（`npm run build` + `vite preview`）環境で実行テストを実施
- **C# 実行テスト結果**: すべての LINQ メソッドが正常に動作し、`.ToString()` による bool 値変換も期待通りに機能
- **TypeScript**: 型アノテーション削除が正しく機能し、エスケープされた引用符やテンプレート文字列が保持される
- **ダークモード**: 言語選択ドロップダウンがダークモードで正しくスタイリングされる

---

## スクリーンショット

### TypeScript実行結果（基本）
![TypeScript基本テスト](https://github.com/user-attachments/assets/d642e2e1-d59d-40ff-a26d-f68281fbd981)

### TypeScript実行結果（高度）
![TypeScript高度なテスト](https://github.com/user-attachments/assets/54b1c7a7-5c45-4ed2-9595-91a2fffcf4dd)

### C#サンプルコード
![C#サンプル](https://github.com/user-attachments/assets/9dbcd7c7-55a7-4c7b-9d97-5746b1b2fd8f)

---

## 結論

テスト実行結果は以下の通り：

### 実行テスト成功 ✅
- **TypeScript**: 型アノテーションの削除が正しく機能し、エスケープされた引用符やテンプレート文字列が保持される
- **ダークモード**: 言語選択ドロップダウンがダークモードで正しくスタイリングされる
- **C#**: ローカルビルドスクリプトを使用してWASMファイルをビルドし、本番環境で実行テストを実施
  - LINQ メソッド（`Any()`, `All()`, `Contains()`）が正常に動作
  - `.ToString()` による bool 値の文字列変換が正しく機能
  - 実行結果: `Hello, World!`, `Sum: 15`, `Any > 3: True`, `All < 10: True`, `Contains 3: True`

### ローカルテスト環境の構築方法
C# の実行テストを行うには、以下の手順でローカル環境を構築：

1. **WASMファイルのビルド**
   ```bash
   ./scripts/build-csharp-wasm.sh
   ```

2. **本番ビルドの作成**
   ```bash
   npm run build
   ```

3. **本番ビルドのプレビュー**
   ```bash
   npx vite preview
   ```

4. **ブラウザでテスト**
   - C# コードランナーページでコードを実行

### 結論
すべての機能が期待通りに動作することを確認。本番環境にデプロイ可能。
