using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;
using Basic.Reference.Assemblies;
using Microsoft.CodeAnalysis;
using System.Collections.Immutable;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
await builder.Build().RunAsync();

// Custom resolver that prevents loading assemblies from file system
public class WasmMetadataReferenceResolver : MetadataReferenceResolver
{
    public override bool Equals(object? other) => other is WasmMetadataReferenceResolver;
    public override int GetHashCode() => typeof(WasmMetadataReferenceResolver).GetHashCode();
    
    public override ImmutableArray<PortableExecutableReference> ResolveReference(
        string reference, 
        string? baseFilePath, 
        MetadataReferenceProperties properties)
    {
        // Don't resolve any file-based references in WASM environment
        return ImmutableArray<PortableExecutableReference>.Empty;
    }
}

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
                    // Use Basic.Reference.Assemblies with custom resolver to prevent file system access
                    // This provides portable metadata that works in WASM without file locations
                    var scriptOptions = ScriptOptions.Default
                        .AddReferences(Net80.References.All)
                        .WithMetadataResolver(new WasmMetadataReferenceResolver())
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
