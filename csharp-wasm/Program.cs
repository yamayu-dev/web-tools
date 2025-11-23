using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;
using System.Reflection;
using Microsoft.CodeAnalysis;
using System.Reflection.Metadata;
using System.Linq;
using System.Collections.Immutable;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;
using Basic.Reference.Assemblies;

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
            // Capture console output
            var output = new StringBuilder();
            var originalOut = Console.Out;
            
            using (var writer = new StringWriter(output))
            {
                Console.SetOut(writer);
                
                try
                {
                    // Use Basic.Reference.Assemblies to get reference assemblies that work in WASM
                    // This avoids the "assembly without location" error
                    var references = Net80.References.All;
                    
                    // Use Roslyn Scripting API with pre-built reference assemblies
                    var scriptOptions = ScriptOptions.Default
                        .WithReferences(references)
                        .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
                        .WithEmitDebugInformation(false)
                        .WithOptimizationLevel(OptimizationLevel.Release);
                    
                    var result = CSharpScript.EvaluateAsync(code, scriptOptions).GetAwaiter().GetResult();
                    
                    if (result != null)
                    {
                        output.AppendLine();
                        output.AppendLine($"戻り値: {result}");
                    }
                }
                catch (CompilationErrorException ex)
                {
                    output.AppendLine("コンパイルエラー:");
                    foreach (var diagnostic in ex.Diagnostics)
                    {
                        output.AppendLine($"  {diagnostic}");
                    }
                }
                catch (Exception ex)
                {
                    output.AppendLine($"実行エラー: {ex.Message}");
                    output.AppendLine($"スタックトレース: {ex.StackTrace}");
                    if (ex.InnerException != null)
                    {
                        output.AppendLine($"内部例外: {ex.InnerException.Message}");
                        output.AppendLine($"内部例外スタック: {ex.InnerException.StackTrace}");
                    }
                }
                finally
                {
                    Console.SetOut(originalOut);
                }
            }
            
            return output.ToString();
        }
        catch (Exception ex)
        {
            return $"システムエラー: {ex.Message}\n{ex.StackTrace}";
        }
    }
}
