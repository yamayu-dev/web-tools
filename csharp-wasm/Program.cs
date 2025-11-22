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
                    // In WebAssembly, assemblies are loaded in memory without file locations
                    // To avoid metadata reference errors, we'll try compilation without explicit references
                    
                    try
                    {
                        // First attempt: Try with minimal script options
                        // Only add imports, no explicit references
                        var scriptOptions = ScriptOptions.Default
                            .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
                            .WithReferences(AppDomain.CurrentDomain.GetAssemblies().Where(a => !a.IsDynamic));
                        
                        var result = CSharpScript.RunAsync(code, scriptOptions).GetAwaiter().GetResult();
                        
                        // If there's a return value, add it to the output
                        if (result.ReturnValue != null)
                        {
                            output.AppendLine();
                            output.AppendLine($"戻り値: {result.ReturnValue}");
                        }
                    }
                    catch (ArgumentException ex) when (ex.Message.Contains("location"))
                    {
                        // If metadata reference error occurs, try alternative approach
                        // Create script without any references and let it fail with better error
                        var scriptOptions = ScriptOptions.Default
                            .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text");
                        
                        var result = CSharpScript.RunAsync(code, scriptOptions).GetAwaiter().GetResult();
                        
                        if (result.ReturnValue != null)
                        {
                            output.AppendLine();
                            output.AppendLine($"戻り値: {result.ReturnValue}");
                        }
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
