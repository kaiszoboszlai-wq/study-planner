# 週間学習プランナー：GitHub + Vercel + Gemini

GitHub Pages は静的ファイルを配信するサービスなので、APIキーを安全に保管してAIを呼び出すサーバー処理を直接動かせません。この版では、コードの保管はGitHub、Webアプリの公開とAPI処理はVercel、AIはGemini APIに分けています。

## 公開手順（初心者向け）

### 1. Google AI StudioでAPIキーを作成

1. https://aistudio.google.com/apikey を開く。
2. Googleアカウントでログインし、APIキーを作成する。
3. キーは他人に見せない。HTMLやGitHubのファイルに書き込まない。

Gemini APIには無料枠がありますが、利用できるモデル・回数には制限があり、条件は変更されることがあります。無料枠では送信データがGoogleの製品改善に使われる場合があるため、氏名・学校名などの個人情報や秘密は入力しないでください。

### 2. GitHubリポジトリにファイルを追加

1. ZIPを展開する。
2. `index.html`、`package.json`、`vercel.json`、`api` フォルダを、既存リポジトリのルートにアップロードする（または別のテスト用リポジトリを作る）。
3. `api` フォルダの中に `chat.js` があることを確認する。

既存の `index.html` を置き換える前に、GitHub上でリポジトリを複製するか、現在のファイルをバックアップしてください。

### 3. Vercelで公開

1. https://vercel.com/ を開き、GitHubアカウントで登録・ログイン。
2. **Add New → Project** から対象のGitHubリポジトリをImport。
3. Framework Presetは **Other**（または自動検出のまま）、Root Directoryはリポジトリのルートにする。
4. デプロイ前またはProject Settings → Environment Variablesで、次の環境変数を追加する。
   - Name: `GEMINI_API_KEY`
   - Value: Google AI Studioで作ったAPIキー
   - Environment: Production（必要ならPreviewも）
5. Deployを実行する。環境変数を後から追加・変更した場合は再デプロイする。
6. 発行された `https://....vercel.app` のURLを開き、AI相談を試す。

### 4. 重要な注意

- AI相談機能を使うときは、GitHub PagesのURLではなく、Vercelが発行したURLを使ってください。このパッケージのAPI呼び出しは同じサイト内の `/api/chat` に送るためです。
- GitHub Pagesの既存URLは静的サイトとして残りますが、そちらではAI相談は動きません。GitHubはコード保管先として引き続き使えます。
- Vercel Hobbyには利用制限があります。Gemini APIの無料枠にも制限があり、無料利用が永久に保証されるわけではありません。
- 公開サイトでは第三者がAI APIを使ってしまう可能性があります。まずは自分用のテストとして使い、利用量を確認してください。一般公開する前には認証や回数制限を追加するのがおすすめです。
- APIキーをGitHubにコミットしないでください。必ずVercelの環境変数に設定します。
