using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis;
using Basic.Reference.Assemblies;
using System.Reflection;
using System.Runtime.Loader;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
await builder.Build().RunAsync();

// Export functions for JavaScript to call
public partial class CSharpRunner
{
    // Helper class source code that provides WASM-compatible implementations
    // for APIs that don't work in single-threaded WebAssembly environment
    private const string WasmHelperClass = @"
namespace WasmHelpers
{
    /// <summary>
    /// Provides WASM-compatible implementations for threading-related APIs
    /// that are not available in single-threaded WebAssembly environment.
    /// </summary>
    public static class WasmTask
    {
        /// <summary>
        /// WASM-compatible replacement for Task.Delay.
        /// In single-threaded WASM, actual delays are not possible,
        /// so this returns a completed task immediately.
        /// </summary>
        public static System.Threading.Tasks.Task Delay(int millisecondsDelay)
        {
            // Validate parameter to match original Task.Delay behavior
            if (millisecondsDelay < -1)
            {
                throw new System.ArgumentOutOfRangeException(nameof(millisecondsDelay), ""The value needs to be either -1 (indicating an infinite timeout), 0 or a positive integer."");
            }
            // In WASM single-threaded environment, we cannot actually delay.
            // Return a completed task to allow async code flow to continue.
            return System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// WASM-compatible replacement for Task.Delay with TimeSpan.
        /// </summary>
        public static System.Threading.Tasks.Task Delay(System.TimeSpan delay)
        {
            // Validate parameter to match original Task.Delay behavior
            long totalMilliseconds = (long)delay.TotalMilliseconds;
            if (totalMilliseconds < -1 || totalMilliseconds > int.MaxValue)
            {
                throw new System.ArgumentOutOfRangeException(nameof(delay), ""The value needs to translate in milliseconds to -1 (infinite timeout), 0 or a positive integer less than or equal to Int32.MaxValue."");
            }
            return System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// WASM-compatible replacement for Task.Delay with CancellationToken.
        /// </summary>
        public static System.Threading.Tasks.Task Delay(int millisecondsDelay, System.Threading.CancellationToken cancellationToken)
        {
            // Validate parameter to match original Task.Delay behavior
            if (millisecondsDelay < -1)
            {
                throw new System.ArgumentOutOfRangeException(nameof(millisecondsDelay), ""The value needs to be either -1 (indicating an infinite timeout), 0 or a positive integer."");
            }
            cancellationToken.ThrowIfCancellationRequested();
            return System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// WASM-compatible replacement for Task.Delay with TimeSpan and CancellationToken.
        /// </summary>
        public static System.Threading.Tasks.Task Delay(System.TimeSpan delay, System.Threading.CancellationToken cancellationToken)
        {
            // Validate parameter to match original Task.Delay behavior
            long totalMilliseconds = (long)delay.TotalMilliseconds;
            if (totalMilliseconds < -1 || totalMilliseconds > int.MaxValue)
            {
                throw new System.ArgumentOutOfRangeException(nameof(delay), ""The value needs to translate in milliseconds to -1 (infinite timeout), 0 or a positive integer less than or equal to Int32.MaxValue."");
            }
            cancellationToken.ThrowIfCancellationRequested();
            return System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// WASM-compatible replacement for task.GetAwaiter().GetResult().
        /// In single-threaded WASM, blocking waits (Monitor.Wait) are not supported.
        /// This method checks if the task is completed and returns, or throws if faulted.
        /// </summary>
        public static void RunSync(System.Threading.Tasks.Task task)
        {
            if (task == null) return;
            
            if (task.IsCompleted)
            {
                if (task.IsFaulted && task.Exception != null)
                {
                    throw task.Exception.InnerException ?? task.Exception;
                }
                return;
            }
            
            // Task is not completed - in WASM we cannot block
            // Since we replace Task.Delay with immediate completion, 
            // this should not happen in practice
            throw new System.InvalidOperationException(""WASM環境ではブロッキング待機はサポートされていません。async/awaitパターンを使用してください。"");
        }

        /// <summary>
        /// WASM-compatible replacement for task.GetAwaiter().GetResult() with return value.
        /// </summary>
        public static T RunSync<T>(System.Threading.Tasks.Task<T> task)
        {
            if (task == null) return default(T);
            
            if (task.IsCompleted)
            {
                if (task.IsFaulted && task.Exception != null)
                {
                    throw task.Exception.InnerException ?? task.Exception;
                }
                return task.Result;
            }
            
            throw new System.InvalidOperationException(""WASM環境ではブロッキング待機はサポートされていません。async/awaitパターンを使用してください。"");
        }
    }

    /// <summary>
    /// WASM-compatible replacement for CancellationTokenSource.
    /// The standard CancellationTokenSource.CancelAfter() uses timers that internally
    /// call Monitor.Wait, which is not supported in single-threaded WASM.
    /// This implementation provides a simplified version that works in WASM.
    /// </summary>
    public class WasmCancellationTokenSource : System.IDisposable
    {
        private readonly System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();

        public System.Threading.CancellationToken Token => _cts.Token;

        public bool IsCancellationRequested => _cts.IsCancellationRequested;

        public void Cancel()
        {
            _cts.Cancel();
        }

        public void Cancel(bool throwOnFirstException)
        {
            _cts.Cancel(throwOnFirstException);
        }

        /// <summary>
        /// WASM-compatible CancelAfter - in single-threaded WASM, we cannot use timers.
        /// This is a no-op in WASM since actual time-based cancellation is not possible.
        /// The cancellation will not automatically trigger.
        /// </summary>
        public void CancelAfter(int millisecondsDelay)
        {
            // In WASM single-threaded environment, we cannot use timers.
            // This is a no-op - the code will run to completion without timeout.
            // Users should be aware that time-based cancellation doesn't work in WASM.
        }

        /// <summary>
        /// WASM-compatible CancelAfter with TimeSpan - no-op in WASM.
        /// </summary>
        public void CancelAfter(System.TimeSpan delay)
        {
            // In WASM single-threaded environment, we cannot use timers.
            // This is a no-op.
        }

        public void Dispose()
        {
            _cts.Dispose();
        }
    }
}
";

    /// <summary>
    /// Preprocesses user code to replace unsupported APIs with WASM-compatible alternatives.
    /// Note: This uses text-based replacement which may affect mentions in strings
    /// or comments. For a code playground, this tradeoff is acceptable to avoid the complexity
    /// of full syntax tree parsing while still enabling the common use case of async code.
    /// </summary>
    private static string PreprocessCode(string code)
    {
        // Replace Task.Delay calls with WasmHelpers.WasmTask.Delay
        // This handles various patterns of Task.Delay usage
        code = System.Text.RegularExpressions.Regex.Replace(
            code,
            @"\bTask\.Delay\b",
            "WasmHelpers.WasmTask.Delay",
            System.Text.RegularExpressions.RegexOptions.None);
        
        // Also handle fully qualified System.Threading.Tasks.Task.Delay
        code = System.Text.RegularExpressions.Regex.Replace(
            code,
            @"\bSystem\.Threading\.Tasks\.Task\.Delay\b",
            "WasmHelpers.WasmTask.Delay",
            System.Text.RegularExpressions.RegexOptions.None);

        // Replace CancellationTokenSource with WASM-compatible version
        // The standard CancellationTokenSource.CancelAfter() uses timers that internally
        // call Monitor.Wait, which is not supported in single-threaded WASM.
        code = System.Text.RegularExpressions.Regex.Replace(
            code,
            @"\bnew\s+CancellationTokenSource\s*\(\s*\)",
            "new WasmHelpers.WasmCancellationTokenSource()",
            System.Text.RegularExpressions.RegexOptions.None);
        
        // Also handle fully qualified System.Threading.CancellationTokenSource
        code = System.Text.RegularExpressions.Regex.Replace(
            code,
            @"\bnew\s+System\.Threading\.CancellationTokenSource\s*\(\s*\)",
            "new WasmHelpers.WasmCancellationTokenSource()",
            System.Text.RegularExpressions.RegexOptions.None);

        // Replace blocking wait patterns that use Monitor.Wait internally
        // These patterns cause "Cannot wait on monitors on this runtime" error in WASM
        
        // Only run regex if the code contains the patterns we're looking for
        // This avoids unnecessary processing and potential performance issues
        if (code.Contains(".GetAwaiter"))
        {
            // Replace .GetAwaiter().GetResult() pattern
            // Transform: someTask.GetAwaiter().GetResult() -> WasmHelpers.WasmTask.RunSync(someTask)
            
            // Match pattern: identifier chain (with optional property access) followed by .GetAwaiter().GetResult()
            // Pattern: (\w+(?:\.\w+)*) matches complete identifier chains like:
            //   - Simple: task
            //   - Property: obj.Task
            //   - Chained: obj.Prop1.Prop2
            // Note: Does NOT handle method calls like GetTaskAsync().GetAwaiter().GetResult()
            // as those patterns can cause catastrophic backtracking. For such cases,
            // users should store the task in a variable first.
            code = System.Text.RegularExpressions.Regex.Replace(
                code,
                @"(\w+(?:\.\w+)*)\s*\.GetAwaiter\s*\(\s*\)\s*\.GetResult\s*\(\s*\)",
                "WasmHelpers.WasmTask.RunSync($1)",
                System.Text.RegularExpressions.RegexOptions.None);
        }
        
        // Only run .Wait() regex if the code actually contains ".Wait("
        if (code.Contains(".Wait("))
        {
            // Replace .Wait() calls on tasks
            // Transform: someTask.Wait() -> WasmHelpers.WasmTask.RunSync(someTask)
            // 
            // Match pattern: identifier chain (with optional property access) followed by .Wait()
            // Pattern: (\w+(?:\.\w+)*) matches complete identifier chains like:
            //   - Simple: task
            //   - Property: obj.Task
            //   - Chained: obj.Prop1.Prop2
            // Note: Does NOT handle method calls like GetTaskAsync().Wait()
            // as those patterns can cause catastrophic backtracking. For such cases,
            // users should store the task in a variable first.
            code = System.Text.RegularExpressions.Regex.Replace(
                code,
                @"(\w+(?:\.\w+)*)\s*\.Wait\s*\(\s*\)",
                "WasmHelpers.WasmTask.RunSync($1)",
                System.Text.RegularExpressions.RegexOptions.None);
        }

        return code;
    }

    /// <summary>
    /// Compiles and executes C# code asynchronously.
    /// This method properly awaits async user code without blocking,
    /// avoiding the "Cannot wait on monitors on this runtime" error in WASM.
    /// </summary>
    [JSExport]
    public static async Task<string> CompileAndRunAsync(string code)
    {
        try
        {
            // Preprocess user code to replace unsupported APIs
            code = PreprocessCode(code);

            // Detect if user code already has a class definition
            // Use a more robust check with word boundaries
            bool hasClassDefinition = System.Text.RegularExpressions.Regex.IsMatch(
                code, 
                @"\bclass\s+\w+", 
                System.Text.RegularExpressions.RegexOptions.Multiline);
            
            string wrappedCode;
            if (hasClassDefinition)
            {
                // User provided complete code with class definition
                // Add using statements only if they're missing
                bool hasUsingStatements = code.Contains("using ");
                wrappedCode = hasUsingStatements 
                    ? code + "\n" + WasmHelperClass
                    : $@"using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

{code}

{WasmHelperClass}";
            }
            else
            {
                // User provided only statements/expressions - wrap them
                wrappedCode = $@"
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class UserProgram
{{
    public static void Execute()
    {{
        {code}
    }}
}}

{WasmHelperClass}";
            }

            // Parse the code
            var syntaxTree = CSharpSyntaxTree.ParseText(wrappedCode);

            // Use Basic.Reference.Assemblies.Net80 which includes all .NET 8.0 reference assemblies
            // This should include System.Runtime, System.Linq, System.Threading.Tasks, etc.
            // Note: Reference assemblies are metadata-only but should be sufficient for compilation
            var references = Net80.References.All;

            // Create compilation
            // Disable features that require threading support in WebAssembly
            var compilation = CSharpCompilation.Create(
                "UserCode",
                new[] { syntaxTree },
                references,
                new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary,
                    concurrentBuild: false,  // Disable concurrent build to avoid threading issues
                    reportSuppressedDiagnostics: false));

            // Compile to memory
            using var ms = new MemoryStream();
            var result = compilation.Emit(ms);

            if (!result.Success)
            {
                var output = new StringBuilder();
                output.AppendLine("コンパイルエラー:");
                foreach (var diagnostic in result.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error))
                {
                    output.AppendLine($"  {diagnostic.GetMessage()}");
                }
                return output.ToString();
            }

            // Load and execute the compiled assembly
            ms.Seek(0, SeekOrigin.Begin);
            var assembly = AssemblyLoadContext.Default.LoadFromStream(ms);
            
            // Try to find the entry point
            // First try UserProgram.Execute (for wrapped snippets)
            var type = assembly.GetType("UserProgram");
            var method = type?.GetMethod("Execute", BindingFlags.Public | BindingFlags.Static);
            
            // If not found, search for any class with a Main method (sync or async)
            if (method == null)
            {
                foreach (var assemblyType in assembly.GetTypes())
                {
                    method = assemblyType.GetMethod("Main", BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic);
                    if (method != null)
                    {
                        type = assemblyType;
                        break;
                    }
                }
            }

            if (method == null)
            {
                return "実行エラー: Execute または Main メソッドが見つかりません";
            }

            // Capture console output
            var consoleOutput = new StringBuilder();
            var originalOut = Console.Out;

            using (var writer = new StringWriter(consoleOutput))
            {
                Console.SetOut(writer);
                
                try
                {
                    // Check if method is async
                    var returnType = method.ReturnType;
                    bool isAsync = returnType == typeof(Task) || 
                                  (returnType.IsGenericType && returnType.GetGenericTypeDefinition() == typeof(Task<>));
                    
                    if (isAsync)
                    {
                        // Execute async method and await for completion
                        // Using await instead of Task.Wait() avoids blocking and
                        // prevents the "Cannot wait on monitors on this runtime" error
                        var task = method.Invoke(null, method.GetParameters().Length == 0 ? null : new object[] { Array.Empty<string>() }) as Task;
                        if (task != null)
                        {
                            await task;
                        }
                    }
                    else
                    {
                        // Execute sync method
                        method.Invoke(null, method.GetParameters().Length == 0 ? null : new object[] { Array.Empty<string>() });
                    }
                }
                catch (Exception ex)
                {
                    var innerEx = ex.InnerException ?? ex;
                    consoleOutput.AppendLine($"実行エラー: {innerEx.Message}");
                    if (!string.IsNullOrEmpty(innerEx.StackTrace))
                    {
                        consoleOutput.AppendLine($"\nスタックトレース:\n{innerEx.StackTrace}");
                    }
                }
                finally
                {
                    Console.SetOut(originalOut);
                }
            }

            return consoleOutput.ToString();
        }
        catch (Exception ex)
        {
            return $"システムエラー: {ex.Message}\n{ex.StackTrace}";
        }
    }

    /// <summary>
    /// Synchronous version for backward compatibility.
    /// This method should only be used for code that doesn't use async/await.
    /// For async code, use CompileAndRunAsync instead.
    /// </summary>
    [JSExport]
    public static string CompileAndRun(string code)
    {
        // This is a separate synchronous implementation for backward compatibility.
        // It handles sync code directly and checks task.IsCompleted for async code.
        // For proper async support, use CompileAndRunAsync instead.
        try
        {
            // Preprocess user code to replace unsupported APIs
            code = PreprocessCode(code);

            // Detect if user code already has a class definition
            // Use a more robust check with word boundaries
            bool hasClassDefinition = System.Text.RegularExpressions.Regex.IsMatch(
                code, 
                @"\bclass\s+\w+", 
                System.Text.RegularExpressions.RegexOptions.Multiline);
            
            string wrappedCode;
            if (hasClassDefinition)
            {
                // User provided complete code with class definition
                // Add using statements only if they're missing
                bool hasUsingStatements = code.Contains("using ");
                wrappedCode = hasUsingStatements 
                    ? code + "\n" + WasmHelperClass
                    : $@"using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

{code}

{WasmHelperClass}";
            }
            else
            {
                // User provided only statements/expressions - wrap them
                wrappedCode = $@"
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class UserProgram
{{
    public static void Execute()
    {{
        {code}
    }}
}}

{WasmHelperClass}";
            }

            // Parse the code
            var syntaxTree = CSharpSyntaxTree.ParseText(wrappedCode);

            // Use Basic.Reference.Assemblies.Net80 which includes all .NET 8.0 reference assemblies
            // This should include System.Runtime, System.Linq, System.Threading.Tasks, etc.
            // Note: Reference assemblies are metadata-only but should be sufficient for compilation
            var references = Net80.References.All;

            // Create compilation
            // Disable features that require threading support in WebAssembly
            var compilation = CSharpCompilation.Create(
                "UserCode",
                new[] { syntaxTree },
                references,
                new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary,
                    concurrentBuild: false,  // Disable concurrent build to avoid threading issues
                    reportSuppressedDiagnostics: false));

            // Compile to memory
            using var ms = new MemoryStream();
            var result = compilation.Emit(ms);

            if (!result.Success)
            {
                var output = new StringBuilder();
                output.AppendLine("コンパイルエラー:");
                foreach (var diagnostic in result.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error))
                {
                    output.AppendLine($"  {diagnostic.GetMessage()}");
                }
                return output.ToString();
            }

            // Load and execute the compiled assembly
            ms.Seek(0, SeekOrigin.Begin);
            var assembly = AssemblyLoadContext.Default.LoadFromStream(ms);
            
            // Try to find the entry point
            // First try UserProgram.Execute (for wrapped snippets)
            var type = assembly.GetType("UserProgram");
            var method = type?.GetMethod("Execute", BindingFlags.Public | BindingFlags.Static);
            
            // If not found, search for any class with a Main method (sync or async)
            if (method == null)
            {
                foreach (var assemblyType in assembly.GetTypes())
                {
                    method = assemblyType.GetMethod("Main", BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic);
                    if (method != null)
                    {
                        type = assemblyType;
                        break;
                    }
                }
            }

            if (method == null)
            {
                return "実行エラー: Execute または Main メソッドが見つかりません";
            }

            // Capture console output
            var consoleOutput = new StringBuilder();
            var originalOut = Console.Out;

            using (var writer = new StringWriter(consoleOutput))
            {
                Console.SetOut(writer);
                
                try
                {
                    // Check if method is async
                    var returnType = method.ReturnType;
                    bool isAsync = returnType == typeof(Task) || 
                                  (returnType.IsGenericType && returnType.GetGenericTypeDefinition() == typeof(Task<>));
                    
                    if (isAsync)
                    {
                        // For async methods in the sync version, we check if the task completes synchronously
                        // This works when Task.Delay is replaced with WasmTask.Delay (which returns CompletedTask)
                        var task = method.Invoke(null, method.GetParameters().Length == 0 ? null : new object[] { Array.Empty<string>() }) as Task;
                        if (task != null)
                        {
                            if (task.IsCompleted)
                            {
                                // Task completed synchronously, safe to get result
                                if (task.IsFaulted && task.Exception != null)
                                {
                                    throw task.Exception.InnerException ?? task.Exception;
                                }
                            }
                            else
                            {
                                // Task is not completed - recommend using async version
                                consoleOutput.AppendLine("警告: 非同期タスクが完了していません。CompileAndRunAsyncを使用してください。");
                            }
                        }
                    }
                    else
                    {
                        // Execute sync method
                        method.Invoke(null, method.GetParameters().Length == 0 ? null : new object[] { Array.Empty<string>() });
                    }
                }
                catch (Exception ex)
                {
                    var innerEx = ex.InnerException ?? ex;
                    consoleOutput.AppendLine($"実行エラー: {innerEx.Message}");
                    if (!string.IsNullOrEmpty(innerEx.StackTrace))
                    {
                        consoleOutput.AppendLine($"\nスタックトレース:\n{innerEx.StackTrace}");
                    }
                }
                finally
                {
                    Console.SetOut(originalOut);
                }
            }

            return consoleOutput.ToString();
        }
        catch (Exception ex)
        {
            return $"システムエラー: {ex.Message}\n{ex.StackTrace}";
        }
    }
}
