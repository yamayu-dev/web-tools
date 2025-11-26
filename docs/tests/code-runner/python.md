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

## 制限事項

- pipでの動的パッケージインストールは不可
- C拡張を必要とする一部パッケージは使用不可
- ファイルシステムアクセスは制限あり
