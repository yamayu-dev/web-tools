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
    [JSExport]
    public static string CompileAndRun(string code)
    {
        try
        {
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
                    ? code 
                    : $@"using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

{code}";
            }
            else
            {
                // User provided only statements/expressions - wrap them
                wrappedCode = $@"
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

public class UserProgram
{{
    public static void Execute()
    {{
        {code}
    }}
}}";
            }

            // Parse the code
            var syntaxTree = CSharpSyntaxTree.ParseText(wrappedCode);

            // Create compilation with Basic.Reference.Assemblies
            // Disable features that require threading support in WebAssembly
            var compilation = CSharpCompilation.Create(
                "UserCode",
                new[] { syntaxTree },
                Net80.References.All,
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
            
            // If not found, search for any class with a Main method
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
                    method.Invoke(null, null);
                }
                catch (Exception ex)
                {
                    var innerEx = ex.InnerException ?? ex;
                    consoleOutput.AppendLine($"実行エラー: {innerEx.Message}");
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
