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
            // In WASM single-threaded environment, we cannot actually delay.
            // Return a completed task to allow async code flow to continue.
            return System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// WASM-compatible replacement for Task.Delay with TimeSpan.
        /// </summary>
        public static System.Threading.Tasks.Task Delay(System.TimeSpan delay)
        {
            return System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// WASM-compatible replacement for Task.Delay with CancellationToken.
        /// </summary>
        public static System.Threading.Tasks.Task Delay(int millisecondsDelay, System.Threading.CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// WASM-compatible replacement for Task.Delay with TimeSpan and CancellationToken.
        /// </summary>
        public static System.Threading.Tasks.Task Delay(System.TimeSpan delay, System.Threading.CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return System.Threading.Tasks.Task.CompletedTask;
        }
    }
}
";

    /// <summary>
    /// Preprocesses user code to replace unsupported APIs with WASM-compatible alternatives.
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

        return code;
    }

    [JSExport]
    public static string CompileAndRun(string code)
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
                        // Execute async method and wait for completion
                        var task = method.Invoke(null, method.GetParameters().Length == 0 ? null : new object[] { Array.Empty<string>() }) as Task;
                        if (task != null)
                        {
                            // Note: In WASM single-threaded environment, we need to use ConfigureAwait(false)
                            // However, GetAwaiter().GetResult() works in the synchronous context
                            task.GetAwaiter().GetResult();
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
