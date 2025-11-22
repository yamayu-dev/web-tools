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
                    // In WebAssembly, assemblies don't have file locations
                    // We must manually create MetadataReferences from in-memory assembly data
                    var references = new List<MetadataReference>();
                    
                    // Get all loaded assemblies from the current AppDomain
                    var loadedAssemblies = AppDomain.CurrentDomain.GetAssemblies();
                    
                    foreach (var assembly in loadedAssemblies)
                    {
                        try
                        {
                            // Skip dynamic assemblies (they can't be used as metadata references)
                            if (assembly.IsDynamic)
                                continue;
                            
                            // Get the assembly name
                            var assemblyName = assembly.GetName().Name;
                            if (string.IsNullOrEmpty(assemblyName))
                                continue;
                            
                            // Try to create a reference from the assembly
                            // In WASM, assembly.Location is empty, but the assembly is loaded in memory
                            // We use unsafe code to get the raw metadata pointer
                            unsafe
                            {
                                assembly.TryGetRawMetadata(out var blob, out var length);
                                if (blob != null && length > 0)
                                {
                                    var moduleMetadata = ModuleMetadata.CreateFromMetadata((IntPtr)blob, length);
                                    var assemblyMetadata = AssemblyMetadata.Create(moduleMetadata);
                                    references.Add(assemblyMetadata.GetReference());
                                }
                            }
                        }
                        catch
                        {
                            // If we can't get metadata for this assembly, skip it
                            // This is OK - we'll work with whatever references we can get
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
