using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;
using System.Reflection;
using Microsoft.CodeAnalysis;
using System.Reflection.Metadata;

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
                    // We need to create MetadataReferences from in-memory assembly bytes
                    
                    var references = new List<MetadataReference>();
                    
                    // Get key assemblies needed for basic C# code
                    var coreAssemblies = new[]
                    {
                        typeof(object).Assembly,           // System.Private.CoreLib
                        typeof(Console).Assembly,          // System.Console
                        typeof(Enumerable).Assembly,       // System.Linq
                        typeof(List<>).Assembly            // System.Collections
                    };
                    
                    // Try to create metadata references from loaded assemblies
                    foreach (var assembly in coreAssemblies)
                    {
                        try
                        {
                            if (assembly.IsDynamic)
                                continue;
                                
                            // In WASM, we can't use assembly.Location, but we can get raw metadata
                            // Using unsafe code to access the assembly bytes
                            unsafe
                            {
                                if (assembly.TryGetRawMetadata(out byte* blob, out int length))
                                {
                                    var span = new ReadOnlySpan<byte>(blob, length);
                                    var bytes = span.ToArray();
                                    references.Add(MetadataReference.CreateFromImage(bytes));
                                }
                            }
                        }
                        catch
                        {
                            // If we can't get metadata for this assembly, skip it
                        }
                    }
                    
                    // Create script options with the references we collected
                    var scriptOptions = ScriptOptions.Default
                        .WithReferences(references)
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
