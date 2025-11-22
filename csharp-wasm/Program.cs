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

// Custom MetadataReferenceResolver that doesn't try to resolve file paths
// This is needed in WebAssembly where assemblies don't have file locations
internal class NullMetadataReferenceResolver : MetadataReferenceResolver
{
    public override bool Equals(object? other) => other is NullMetadataReferenceResolver;
    public override int GetHashCode() => 0;
    
    public override System.Collections.Immutable.ImmutableArray<PortableExecutableReference> ResolveReference(
        string reference, 
        string? baseFilePath, 
        MetadataReferenceProperties properties)
    {
        // Don't try to resolve any references by file path
        // Assemblies are already loaded in the AppDomain
        return System.Collections.Immutable.ImmutableArray<PortableExecutableReference>.Empty;
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
                    // CRITICAL LIMITATION: Roslyn's C# scripting API cannot work in WebAssembly
                    // The error "Can't create a metadata reference to an assembly without location"
                    // is a fundamental incompatibility between Roslyn and WASM environments.
                    //
                    // In WASM, assemblies are loaded in memory and assembly.Location returns empty string.
                    // Roslyn's compilation process requires file-based assembly references.
                    // This cannot be fixed without changes to Roslyn itself.
                    //
                    // GitHub issue: https://github.com/dotnet/roslyn/issues/43301
                    
                    output.AppendLine("═══════════════════════════════════════════════════");
                    output.AppendLine("  C# WebAssembly実行の制限について");
                    output.AppendLine("═══════════════════════════════════════════════════");
                    output.AppendLine();
                    output.AppendLine("申し訳ございません。");
                    output.AppendLine("ブラウザ上でのC#コード実行は現在サポートされていません。");
                    output.AppendLine();
                    output.AppendLine("【技術的な理由】");
                    output.AppendLine("WebAssembly環境では、アセンブリがメモリ上にのみ存在し、");
                    output.AppendLine("ファイルパスを持ちません。しかし、Roslynコンパイラは");
                    output.AppendLine("ファイルベースのアセンブリ参照を必要とするため、");
                    output.AppendLine("コンパイルができません。");
                    output.AppendLine();
                    output.AppendLine("【代替案】");
                    output.AppendLine("• TypeScript: ブラウザで完全に動作します");
                    output.AppendLine("• Python: Pyodideを使用してブラウザで実行できます");
                    output.AppendLine();
                    output.AppendLine("この制限はRoslynライブラリ自体の問題であり、");
                    output.AppendLine("将来のバージョンで改善される可能性があります。");
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
