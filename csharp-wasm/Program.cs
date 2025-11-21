using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using System.Runtime.InteropServices.JavaScript;
using System.Text;

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
                
                // For now, execute the sample code pattern directly
                // In a full implementation, this would use Roslyn to compile and execute arbitrary C# code
                ExecuteSampleCode(output);
                
                Console.SetOut(originalOut);
            }
            
            return output.ToString();
        }
        catch (Exception ex)
        {
            return $"実行エラー: {ex.Message}\n{ex.StackTrace}";
        }
    }
    
    private static void ExecuteSampleCode(StringBuilder output)
    {
        // Execute a simplified version of the sample code
        // This is a placeholder until full Roslyn compilation is implemented
        output.AppendLine("Hello, World!");
        output.AppendLine();
        
        // Simple calculation
        int[] numbers = { 1, 2, 3, 4, 5 };
        int sum = 0;
        foreach (int num in numbers)
        {
            sum += num;
        }
        output.AppendLine($"Sum: {sum}");
        
        output.AppendLine();
        output.AppendLine("注意: 現在は組み込みのサンプルコードを実行しています。");
        output.AppendLine("カスタムコードの実行にはRoslynコンパイラの統合が必要です。");
    }
}
