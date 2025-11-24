#!/bin/bash

# C# WebAssembly ローカルビルドスクリプト
# GitHub Actions と同じ手順でローカル環境でWASMファイルをビルドします
#
# 使い方:
#   ./scripts/build-csharp-wasm.sh
#
# 前提条件:
#   - .NET 8.0 SDK がインストールされていること
#   - jq コマンドがインストールされていること (JSON パース用)
#     - Ubuntu/Debian: sudo apt-get install jq
#     - macOS: brew install jq

set -e  # エラーが発生したら即座に終了

# カラー出力用
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# スクリプトのディレクトリからリポジトリルートへ移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo -e "${GREEN}=== C# WebAssembly ローカルビルドスクリプト ===${NC}"

# 前提条件のチェック
echo -e "\n${YELLOW}[1/6] 前提条件のチェック${NC}"

# .NET SDK のチェック
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}エラー: .NET SDK が見つかりません${NC}"
    echo "以下のURLからインストールしてください:"
    echo "https://dotnet.microsoft.com/download"
    exit 1
fi

DOTNET_VERSION=$(dotnet --version)
echo "✓ .NET SDK が見つかりました (バージョン: $DOTNET_VERSION)"

# jq のチェック
if ! command -v jq &> /dev/null; then
    echo -e "${RED}エラー: jq コマンドが見つかりません${NC}"
    echo "インストール方法:"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  macOS: brew install jq"
    exit 1
fi
echo "✓ jq が見つかりました"

# 設定ファイルの読み込み
echo -e "\n${YELLOW}[2/6] 設定ファイルの読み込み${NC}"

if [ ! -f "csharp-wasm.config.json" ]; then
    echo -e "${RED}エラー: csharp-wasm.config.json が見つかりません${NC}"
    exit 1
fi

OUTPUT_PATH=$(jq -r '.outputPath' csharp-wasm.config.json)
VERSION_FILENAME=$(jq -r '.versionFilename' csharp-wasm.config.json)
BUILD_VERSION=$(jq -r '.buildVersion' csharp-wasm.config.json)

echo "  出力パス: $OUTPUT_PATH"
echo "  バージョンファイル名: $VERSION_FILENAME"
echo "  ビルドバージョン: $BUILD_VERSION"

# WASM ワークロードのインストール
echo -e "\n${YELLOW}[3/6] WASM ワークロードのチェック${NC}"

# ワークロードがインストールされているかチェック
if ! dotnet workload list | grep -q "wasm-tools"; then
    echo "WASM ワークロードをインストールしています..."
    dotnet workload install wasm-tools
    echo "✓ WASM ワークロードをインストールしました"
else
    echo "✓ WASM ワークロードは既にインストールされています"
fi

# C# WebAssembly のビルド
echo -e "\n${YELLOW}[4/6] C# WebAssembly のビルド${NC}"

cd csharp-wasm
echo "dotnet publish -c Release を実行中..."
dotnet publish -c Release
cd ..

echo "✓ ビルドが完了しました"

# WASM ファイルのコピー
echo -e "\n${YELLOW}[5/6] WASM ファイルのコピー${NC}"

FRAMEWORK_PATH="${OUTPUT_PATH}/net8.0/publish/wwwroot/_framework"

if [ ! -d "$FRAMEWORK_PATH" ]; then
    echo -e "${RED}エラー: フレームワークパス $FRAMEWORK_PATH が見つかりません${NC}"
    exit 1
fi

echo "WASM ファイルを $FRAMEWORK_PATH から $OUTPUT_PATH にコピーしています..."

# _framework から root へすべてのファイルをコピー
cp -v "$FRAMEWORK_PATH"/* "$OUTPUT_PATH/" 2>/dev/null || true

# ローカライズリソースのサブディレクトリをコピー (cs, de, es, fr, etc.)
for dir in "$FRAMEWORK_PATH"/*/; do
    if [ -d "$dir" ]; then
        dir_name=$(basename "$dir")
        echo "  サブディレクトリをコピー: $dir_name"
        mkdir -p "$OUTPUT_PATH/$dir_name"
        cp -rv "$dir"* "$OUTPUT_PATH/$dir_name/" 2>/dev/null || true
    fi
done

# 中間ビルドディレクトリをクリーンアップ
echo "中間ビルドディレクトリをクリーンアップしています..."
rm -rf "${OUTPUT_PATH}/net8.0"

echo "✓ WASM ファイルのコピーが完了しました"
echo ""
echo "出力ファイル (最初の20件):"
ls -lh "$OUTPUT_PATH" | head -20

# バージョン情報の作成
echo -e "\n${YELLOW}[6/6] バージョン情報の作成${NC}"

BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "{\"version\":\"$BUILD_VERSION\",\"buildDate\":\"$BUILD_DATE\"}" > "$OUTPUT_PATH/$VERSION_FILENAME"
echo "✓ バージョン情報を作成しました: $OUTPUT_PATH/$VERSION_FILENAME"

# 完了メッセージ
echo -e "\n${GREEN}=== ビルド完了 ===${NC}"
echo ""
echo "WASM ファイルは以下のディレクトリに出力されました:"
echo "  $OUTPUT_PATH"
echo ""
echo "次のステップ:"
echo "  1. 開発サーバーを起動: npm run dev"
echo "  2. ブラウザでアプリケーションを開く"
echo "  3. C# コードランナーページでテスト"
echo ""
