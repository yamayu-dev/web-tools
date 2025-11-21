# C# WebAssembly Runner

This project compiles C# code into WebAssembly for client-side execution in the browser.

## Building

```bash
dotnet publish -c Release
```

The output will be placed in `../public/wasm/`

## Configuration

To trigger a rebuild via GitHub Actions, update the `buildVersion` in `../csharp-wasm.config.json`.

## Architecture

- Uses Blazor WebAssembly as the runtime
- Exports functions via JSExport for JavaScript interop
- Intended to provide client-side C# compilation and execution

## TODO

- Integrate Roslyn compiler for dynamic C# compilation
- Implement code execution sandbox
- Add error handling and output capture
