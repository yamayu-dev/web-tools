# Python コードランナー テスト仕様書

## 概要

Pythonコードランナーの機能検証テストケース集です。

## 環境情報

- **言語**: Python
- **実行環境**: Pyodide (WebAssembly)
- **バージョン**: Pyodide v0.24.1
- **利用可能**: Python標準ライブラリ、numpy、pandas、matplotlib等

---

## テストケース

### TC-PY-001: 基本的な関数定義と呼び出し

**目的**: 関数定義、f-string、print関数が正しく動作すること

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
```

**期待結果**:
```
Hello, World!
```

---

### TC-PY-002: リスト操作と内包表記

**目的**: リスト、sum関数、内包表記が正しく動作すること

```python
numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"Sum: {total}")

squares = [x**2 for x in numbers]
print(f"Squares: {squares}")
```

**期待結果**:
```
Sum: 15
Squares: [1, 4, 9, 16, 25]
```

---

### TC-PY-003: クラス定義

**目的**: クラス定義、コンストラクタ、メソッドが正しく動作すること

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def introduce(self):
        return f"私は{self.name}、{self.age}歳です"

person = Person("太郎", 25)
print(person.introduce())
```

**期待結果**:
```
私は太郎、25歳です
```

---

### TC-PY-004: 辞書操作

**目的**: 辞書の作成、アクセス、メソッドが正しく動作すること

```python
user = {"name": "花子", "email": "hanako@example.com", "age": 30}
print(f"Name: {user['name']}, Email: {user['email']}")

for key, value in user.items():
    print(f"{key}: {value}")
```

**期待結果**:
```
Name: 花子, Email: hanako@example.com
name: 花子
email: hanako@example.com
age: 30
```

---

### TC-PY-005: ラムダ式とmap/filter

**目的**: ラムダ式、map、filterが正しく動作すること

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = list(filter(lambda x: x % 2 == 0, numbers))
doubled = list(map(lambda x: x * 2, evens))
print(f"Even numbers doubled: {doubled}")
```

**期待結果**:
```
Even numbers doubled: [4, 8, 12, 16, 20]
```

---

### TC-PY-006: 例外処理

**目的**: try/except/finallyが正しく動作すること

```python
def divide(a, b):
    try:
        result = a / b
        return f"Result: {result}"
    except ZeroDivisionError:
        return "Error: Cannot divide by zero"
    finally:
        print("Calculation attempted")

print(divide(10, 2))
print(divide(10, 0))
```

**期待結果**:
```
Calculation attempted
Result: 5.0
Calculation attempted
Error: Cannot divide by zero
```

---

### TC-PY-007: ジェネレータ

**目的**: ジェネレータ関数が正しく動作すること

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

fib_list = list(fibonacci(10))
print(f"Fibonacci: {fib_list}")
```

**期待結果**:
```
Fibonacci: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

---

### TC-PY-008: async/await基本パターン

**目的**: 非同期関数の定義と呼び出しが正しく動作すること

```python
import asyncio

async def greet_async(name):
    print(f"Starting greeting for {name}")
    await asyncio.sleep(0.1)
    print(f"Hello, {name}!")
    return f"Greeted {name}"

result = await greet_async("World")
print(f"Result: {result}")
```

**期待結果**:
```
Starting greeting for World
Hello, World!
Result: Greeted World
```

---

### TC-PY-009: asyncio.gather（並列実行）

**目的**: 複数の非同期タスクを並列に実行できること

```python
import asyncio

async def process_item(item):
    await asyncio.sleep(0.01)
    return item * 2

async def main():
    items = [1, 2, 3, 4, 5]
    results = await asyncio.gather(*[process_item(i) for i in items])
    print(f"Results: {results}")

await main()
```

**期待結果**:
```
Results: [2, 4, 6, 8, 10]
```

---

### TC-PY-010: async for（非同期イテレータ）

**目的**: 非同期イテレータが正しく動作すること

```python
import asyncio

async def async_range(start, stop):
    for i in range(start, stop):
        await asyncio.sleep(0.01)
        yield i

async def main():
    results = []
    async for num in async_range(1, 6):
        results.append(num * 2)
    print(f"Doubled: {results}")

await main()
```

**期待結果**:
```
Doubled: [2, 4, 6, 8, 10]
```

---

### TC-PY-011: 非同期コンテキストマネージャ

**目的**: async withが正しく動作すること

```python
import asyncio

class AsyncResource:
    async def __aenter__(self):
        print("Acquiring resource")
        await asyncio.sleep(0.01)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Releasing resource")
        await asyncio.sleep(0.01)
        return False
    
    async def do_work(self):
        print("Working with resource")
        return "Done"

async def main():
    async with AsyncResource() as resource:
        result = await resource.do_work()
        print(f"Result: {result}")

await main()
```

**期待結果**:
```
Acquiring resource
Working with resource
Result: Done
Releasing resource
```

---

### TC-PY-012: asyncio.run（エントリポイント）

**目的**: asyncio.run()を使った標準的な非同期コードが動作すること（自動変換）

```python
import asyncio

async def fetch_data(id):
    await asyncio.sleep(0.01)
    return {"id": id, "data": f"Item {id}"}

async def main():
    tasks = [fetch_data(i) for i in range(1, 4)]
    results = await asyncio.gather(*tasks)
    for r in results:
        print(f"ID: {r['id']}, Data: {r['data']}")

asyncio.run(main())
```

**期待結果**:
```
ID: 1, Data: Item 1
ID: 2, Data: Item 2
ID: 3, Data: Item 3
```

**注意**: `asyncio.run(main())` は自動的に `await main()` に変換されます

---

## 制限事項

- pipでの動的パッケージインストールは不可
- C拡張を必要とする一部パッケージは使用不可
- ファイルシステムアクセスは制限あり
- `asyncio.run()` は自動的に `await` に変換される（手動変換不要）
- 長時間のスリープ（asyncio.sleep）は実際の遅延なしで即座に完了する可能性あり
