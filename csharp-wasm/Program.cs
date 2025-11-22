using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;
using System.Reflection;
using Microsoft.CodeAnalysis;

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
                    // Execute the C# code using Roslyn scripting
                    // In WebAssembly, assemblies are loaded in memory without a file location
                    // We need to explicitly add references to commonly used assemblies
                    var references = new List<MetadataReference>();
                    
                    // Add references to common assemblies that are needed for most C# code
                    var commonAssemblies = new[]
                    {
                        typeof(object).Assembly,                    // System.Private.CoreLib
                        typeof(Console).Assembly,                   // System.Console
                        typeof(Enumerable).Assembly,                // System.Linq
                        typeof(System.Collections.Generic.List<>).Assembly // System.Collections
                    };
                    
                    foreach (var assembly in commonAssemblies)
                    {
                        try
                        {
                            if (!assembly.IsDynamic && !string.IsNullOrEmpty(assembly.Location))
                            {
                                references.Add(MetadataReference.CreateFromFile(assembly.Location));
                            }
                        }
                        catch
                        {
                            // If we can't add this assembly, continue with others
                        }
                    }
                    
                    // If no references were added (WASM environment), don't use WithReferences
                    // This will use default references which may work better in WASM
                    var scriptOptions = references.Count > 0
                        ? ScriptOptions.Default
                            .WithReferences(references)
                            .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
                        : ScriptOptions.Default
                            .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text");
                    
                    var result = CSharpScript.RunAsync(code, scriptOptions).GetAwaiter().GetResult();
                    
                    // If there's a return value, add it to the output
                    if (result.ReturnValue != null)
                    {
                        output.AppendLine();
                        output.AppendLine($"戻り値: {result.ReturnValue}");
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
