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

var builder = WebAssemblyHostBuilder.CreateDefault(args);
await builder.Build().RunAsync();

// Custom metadata reference resolver for WASM that doesn't try to resolve file paths
public class WasmMetadataReferenceResolver : MetadataReferenceResolver
{
    public override bool Equals(object? other) => other is WasmMetadataReferenceResolver;
    public override int GetHashCode() => 1;
    
    public override ImmutableArray<PortableExecutableReference> ResolveReference(
        string reference,
        string? baseFilePath,
        MetadataReferenceProperties properties)
    {
        // Return empty array - don't try to resolve file-based references in WASM
        return ImmutableArray<PortableExecutableReference>.Empty;
    }
}

// Export functions for JavaScript to call
public partial class CSharpRunner
{
    // Helper method to add assembly reference
    private static void AddAssemblyReference(Assembly assembly, List<MetadataReference> references)
    {
        // Try to use location if available (non-WASM scenario)
        if (!string.IsNullOrEmpty(assembly.Location))
        {
            references.Add(MetadataReference.CreateFromFile(assembly.Location));
            return;
        }
        
        // In WASM, we can't use assembly.Location, but we can get raw metadata
        // Using unsafe code to access the assembly bytes
        unsafe
        {
            if (assembly.TryGetRawMetadata(out byte* blob, out int length))
            {
                var span = new ReadOnlySpan<byte>(blob, length);
                var bytes = span.ToArray();
                
                // Create metadata reference from the assembly bytes
                // Use ImmutableArray and explicitly pass filePath: null to indicate no physical location
                var immutableBytes = ImmutableArray.Create(bytes);
                var reference = MetadataReference.CreateFromImage(
                    immutableBytes,
                    properties: default,
                    documentation: null,
                    filePath: null);
                
                references.Add(reference);
            }
        }
    }
    
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
                    
                    // Create a set to track assemblies we've already added
                    var addedAssemblies = new HashSet<string>();
                    
                    // Load ALL non-dynamic assemblies to avoid type resolution issues
                    // This is crucial because Roslyn might try to resolve type forwarders
                    // and other indirect references during compilation
                    var allAssemblies = AppDomain.CurrentDomain.GetAssemblies()
                        .Where(a => !a.IsDynamic)
                        .ToList();
                    
                    foreach (var assembly in allAssemblies)
                    {
                        var assemblyName = assembly.GetName().Name;
                        if (assemblyName == null || addedAssemblies.Contains(assemblyName))
                            continue;
                            
                        try
                        {
                            AddAssemblyReference(assembly, references);
                            addedAssemblies.Add(assemblyName);
                        }
                        catch
                        {
                            // Skip assemblies that can't be loaded
                        }
                    }
                    
                    // Create script options with the references we collected
                    var scriptOptions = ScriptOptions.Default
                        .WithReferences(references)
                        .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
                        .WithAllowUnsafe(true)
                        .WithCheckOverflow(false)
                        .WithFileEncoding(Encoding.UTF8)
                        .WithMetadataResolver(new WasmMetadataReferenceResolver());
                    
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
