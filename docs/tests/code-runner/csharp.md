# C# コードランナー テスト仕様書

## 概要

C# WebAssemblyコードランナーの機能検証テストケース集です。

## 環境情報

- **言語**: C# 12.0
- **フレームワーク**: .NET 8.0
- **実行環境**: WebAssembly (Blazor WASM)
- **WASMバージョン**: 設定ファイル `csharp-wasm.config.json` で管理

---

## テストケース

### TC-CS-001: 基本的なMain関数

**目的**: エントリポイント、Console.WriteLineが正しく動作すること

```csharp
using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, World!");
    }
}
```

**期待結果**:
```
Hello, World!
```

---

### TC-CS-002: LINQ基本操作

**目的**: LINQ拡張メソッドが正しく動作すること

```csharp
using System;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] numbers = { 1, 2, 3, 4, 5 };
        int sum = numbers.Sum();
        Console.WriteLine($"Sum: {sum}");
        
        var evens = numbers.Where(n => n % 2 == 0).ToArray();
        Console.WriteLine($"Evens: {string.Join(", ", evens)}");
    }
}
```

**期待結果**:
```
Sum: 15
Evens: 2, 4
```

---

### TC-CS-003: クラス定義とプロパティ

**目的**: クラス、プロパティ、メソッドが正しく動作すること

```csharp
using System;

class Person
{
    public string Name { get; }
    public int Age { get; }
    
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
    
    public string Introduce()
    {
        return $"私は{Name}、{Age}歳です";
    }
}

class Program
{
    static void Main()
    {
        var person = new Person("太郎", 25);
        Console.WriteLine(person.Introduce());
    }
}
```

**期待結果**:
```
私は太郎、25歳です
```

---

### TC-CS-004: async/await基本パターン

**目的**: 非同期処理が正しく動作すること（WASMでの制限を考慮）

```csharp
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        Console.WriteLine("Start");
        await DoWorkAsync();
        Console.WriteLine("End");
    }
    
    static async Task DoWorkAsync()
    {
        await Task.Delay(100);  // WASMでは実際の遅延なし
        Console.WriteLine("Work done");
    }
}
```

**期待結果**:
```
Start
Work done
End
```

---

### TC-CS-005: Task.WhenAll

**目的**: 並列タスク処理が正しく動作すること

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var tasks = Enumerable.Range(1, 5)
            .Select(i => ProcessAsync(i));
        
        var results = await Task.WhenAll(tasks);
        Console.WriteLine($"Results: {string.Join(", ", results)}");
    }
    
    static async Task<int> ProcessAsync(int n)
    {
        await Task.Delay(10);
        return n * 2;
    }
}
```

**期待結果**:
```
Results: 2, 4, 6, 8, 10
```

---

### TC-CS-006: 例外処理

**目的**: try/catch/finallyが正しく動作すること

```csharp
using System;

class Program
{
    static void Main()
    {
        try
        {
            int result = Divide(10, 2);
            Console.WriteLine($"Result: {result}");
            
            Divide(10, 0);
        }
        catch (DivideByZeroException)
        {
            Console.WriteLine("Error: Cannot divide by zero");
        }
        finally
        {
            Console.WriteLine("Calculation completed");
        }
    }
    
    static int Divide(int a, int b)
    {
        if (b == 0) throw new DivideByZeroException();
        return a / b;
    }
}
```

**期待結果**:
```
Result: 5
Error: Cannot divide by zero
Calculation completed
```

---

### TC-CS-007: Dictionary操作

**目的**: ジェネリックコレクションが正しく動作すること

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        var dict = new Dictionary<string, int>
        {
            ["apple"] = 100,
            ["banana"] = 200,
            ["cherry"] = 150
        };
        
        foreach (var kvp in dict)
        {
            Console.WriteLine($"{kvp.Key}: {kvp.Value}");
        }
        
        Console.WriteLine($"Total: {dict.Values.Sum()}");
    }
}
```

**期待結果**:
```
apple: 100
banana: 200
cherry: 150
Total: 450
```

---

### TC-CS-008: CancellationTokenSource（WASM互換版）

**目的**: キャンセルトークンの基本的な使用が動作すること（時間ベースキャンセルはno-op）

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var cts = new CancellationTokenSource();
        cts.CancelAfter(TimeSpan.FromSeconds(2));  // WASMでは実際にはキャンセルされない
        
        try
        {
            await DoWorkAsync(cts.Token);
            Console.WriteLine("Work completed successfully");
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation was canceled");
        }
    }
    
    static async Task DoWorkAsync(CancellationToken token)
    {
        for (int i = 0; i < 3; i++)
        {
            token.ThrowIfCancellationRequested();
            Console.WriteLine($"Step {i + 1}");
            await Task.Delay(100);
        }
    }
}
```

**期待結果**:
```
Step 1
Step 2
Step 3
Work completed successfully
```

---

## 制限事項

- 外部NuGetパッケージは使用不可（ブラウザ環境のため）
- `Console.WriteLine(bool)` はサポートなし → `.ToString()` で文字列化が必要
- `Task.Delay` は動作するが実際の遅延なし（WASMシングルスレッド制限）
- `CancellationTokenSource.CancelAfter()` は時間ベースキャンセルが機能しない（no-op）
- ファイルシステムアクセスは制限あり
- ネットワーク機能は制限あり
