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
        // Skip if assembly location is available (shouldn't happen in WASM, but just in case)
        if (!string.IsNullOrEmpty(assembly.Location))
        {
            try
            {
                references.Add(MetadataReference.CreateFromFile(assembly.Location));
                return;
            }
            catch
            {
                // Fall through to WASM method
            }
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
            else
            {
                // If TryGetRawMetadata fails, we cannot add this assembly
                // This should not happen for normal assemblies, but log it for debugging
                Console.WriteLine($"Warning: Could not get raw metadata for assembly: {assembly.GetName().Name}");
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
                    
                    // CRITICAL: Add the language runtime assembly FIRST
                    // Roslyn requires this and will try to add it automatically if it's not present
                    // In WASM, this will fail if we don't add it manually first
                    var runtimeAssembly = typeof(object).Assembly;
                    try
                    {
                        AddAssemblyReference(runtimeAssembly, references);
                        var runtimeName = runtimeAssembly.GetName().Name;
                        if (runtimeName != null)
                        {
                            addedAssemblies.Add(runtimeName);
                        }
                    }
                    catch (Exception ex)
                    {
                        // If we can't add the runtime assembly, compilation will fail
                        output.AppendLine($"致命的エラー: ランタイムアセンブリを読み込めません: {ex.Message}");
                        return output.ToString();
                    }
                    
                    // Load only essential assemblies to avoid issues with assemblies that can't be referenced
                    // In WASM, some assemblies may not have accessible metadata
                    var essentialAssemblyNames = new[] {
                        "System.Runtime",
                        "System.Console",
                        "System.Collections",
                        "System.Linq",
                        "System.Linq.Expressions",
                        "netstandard"
                    };
                    
                    var allAssemblies = AppDomain.CurrentDomain.GetAssemblies()
                        .Where(a => !a.IsDynamic)
                        .ToList();
                    
                    // First, add essential assemblies
                    foreach (var assembly in allAssemblies)
                    {
                        var assemblyName = assembly.GetName().Name;
                        if (assemblyName == null || !essentialAssemblyNames.Contains(assemblyName))
                            continue;
                            
                        if (addedAssemblies.Contains(assemblyName))
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
                    
                    // Then, add other non-dynamic assemblies for extended functionality
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
                    // Set metadata resolver and other options first, then references last
                    // This prevents Roslyn from trying to auto-load assemblies without locations in WASM
                    var scriptOptions = ScriptOptions.Default
                        .WithMetadataResolver(new WasmMetadataReferenceResolver())
                        .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
                        .WithAllowUnsafe(true)
                        .WithCheckOverflow(false)
                        .WithFileEncoding(Encoding.UTF8)
                        .WithEmitDebugInformation(false)
                        .WithOptimizationLevel(Microsoft.CodeAnalysis.OptimizationLevel.Release)
                        .WithReferences(references);  // Set references LAST to override defaults
                    
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
