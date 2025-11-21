using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using System.Runtime.InteropServices.JavaScript;

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
            // TODO: Implement Roslyn-based compilation
            // For now, return a placeholder
            return "C# WASM compilation coming soon...";
        }
        catch (Exception ex)
        {
            return $"Error: {ex.Message}";
        }
    }
}
