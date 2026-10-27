# 楽天ブックスAPIの設定と検証記録

2026-10-27更新。公開版 `https://study-planner-sigma-tawny.vercel.app/` で楽天ブックスAPIを有効化済みです。キー3項目はVercelのProduction専用Secretとして登録しました。公開版ブラウザーからのAPI照会、楽天の実表紙2冊の表示、商品リンク・指定クレジット、取得不可時のイラスト表示を確認済みです。非公開確認用Sitesの楽天APIは無効のまま維持します。

## 発行するもの

1. [楽天ウェブサービス](https://webservice.rakuten.co.jp/)に楽天会員アカウントでログインし、アプリを登録します。
2. 登録画面でアプリIDとアクセスキーを発行します。現在のBooks Book Searchは両方が必要です。
3. 値をチャットやプロフィール設定に貼らず、サーバーのシークレット設定に登録します。

サーバー設定は `.env.example` を参照。アプリIDは `RAKUTEN_APPLICATION_ID`、アクセスキーは `RAKUTEN_ACCESS_KEY`、楽天のアフィリエイトIDは `RAKUTEN_AFFILIATE_ID`、アプリの正規オリジンは `RAKUTEN_APP_ORIGIN`（末尾スラッシュなし）。ブラウザーのJavaScript・公開JSON・Gitにはキーを含めません。

## 現在のプレビューと利用条件

Sitesプレビューは非公開を維持し、既存のHTML・静的アセットにサーバーAPIを追加する構成へ移行済みです。非公開プレビューの `RAKUTEN_USE_CONTEXT` は `disabled` とし、キーが登録されていても上流APIにはアクセスしません。ブラウザーは接続可否を一度確認し、利用不可なら既存の書影・イラストを表示します。公開コードにAPIキーを埋め込む方法は使用しません。

[楽天ウェブサービス規約](https://webservice.rakuten.co.jp/guide/rule)第10条第1項第10号は、明示的な許可がある場合を除き、特定の人のみがアクセスできる環境での利用を禁止しています。非公開プレビューはそのまま維持し、実APIは無効にします。

実接続には次のいずれかの環境と、サーバーAPIの配置が必要です。

- ユーザーが別途公開を指定した本番環境：`RAKUTEN_USE_CONTEXT=public`
- 楽天から非公開利用の明示的許可を得た環境：`RAKUTEN_USE_CONTEXT=private-approved`

この設定値自体は許可を取得するものではありません。条件を確認するまで空欄にします。公開範囲は自動変更しません。

## 実装・配置

- `server/rakuten-books.mjs`：Web標準Request/Responseの接続処理。ランタイムのenvを渡します。
- `server/rakuten-catalog.json`：既存の収録教材から生成したISBN・書名の照合用データ。楽天の取得データは含みません。
- `api/rakuten-books.js`：Node/VercelのGETアダプター。`/api/rakuten-books` に配置し、同梱のserverファイルを含めます。Sitesでは、別の確認用リポジトリにあるCloudflare ViteのWorkerが同じ処理を `/api/rakuten-books` に配置し、ASSETS bindingで既存画面・アセットを配信します。`npm run build` が `dist/server/index.js` と `dist/client` を生成します。
- `assets/rakuten-covers.js`：既存の許可済み表紙がない教材をISBNで照会。取得結果は保存ルート・Firebase・localStorage・静的カタログに保存しません。

公式API `https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404` を使用。アクセスキーはヘッダー、アプリIDは公式仕様に従いクエリーに付与します。上流の応答・URL・キーをログやエラー応答に出しません。ISBNと書名を照合し、画像と商品リンクのドメインを検証します。登録教材以外の検索は受け付けません。

同時リクエストをまとめ、サーバーインスタンス当たり約1秒に1回に制限します。429・認証エラー時は待機し、自動再試行しません。複数インスタンスを使う本番運用では、同じキーの共有レート制御も必要です。

楽天の画像を使う教材欄には楽天APIが返すアフィリエイト商品リンクと[指定クレジット](https://webservice.rakuten.co.jp/guide/credit)を表示し、その欄の外部書誌リンクを隠します。取得失敗や画像の表示失敗はイラストに戻します。画像の一括ダウンロード・静的再配布は行いません。

## 発行後の確認

サーバー配置・許可された利用環境・キー設定を揃えた後、実ISBNで書影・商品URL・クレジット・取得失敗時の代替表示を確認します。発行だけで全教材の表紙が使えると確定するわけではありません。最新版・出題範囲の選別を通る教材の中で、売れ筋を優先します（詳細は [選定基準](route-selection.md)）。

公式資料：[API仕様](https://webservice.rakuten.co.jp/documentation/books-book-search)、[利用規約](https://webservice.rakuten.co.jp/guide/rule)、[クレジット](https://webservice.rakuten.co.jp/guide/credit)。

## 反映記録

2026-10-27（日本時間）、確認用サイトのバージョン33にサーバーAPIを配置済み。公開範囲は所有者のみ、環境設定リビジョン1を反映済みです。実サイトの接続可否・ISBN照会エンドポイントはHTTP 200で応答し、無効状態を返すことを確認しました。楽天上流への実リクエストは行っていません。元のGitHubリポジトリには未反映です。

## 公開版の接続作業（2026-10-27）

ユーザーから、既に一般公開済みのURL `https://study-planner-sigma-tawny.vercel.app/` での有効化を指示されました。確認用Sitesの公開範囲は変更しません。VercelのAPI起動エラーを修正してGitHubに反映し、APIの登録ドメイン検証に渡すOrigin/Refererを正規の公開オリジンに固定しました。

VercelのProductionに既発行キー3項目をSecretとして登録し、`RAKUTEN_APP_ORIGIN=https://study-planner-sigma-tawny.vercel.app`、`RAKUTEN_USE_CONTEXT=public` を設定して再デプロイしました。Sitesに登録したシークレットとは別に管理します。

設定途中では403 `HTTP_REFERRER_NOT_ALLOWED` が発生しましたが、公開版の最終確認では取得に成功しています。「英単語ターゲット1200」「数学Ⅰ・A 基礎問題精講」の実画像と楽天商品リンク・指定クレジットをブラウザーで確認し、取得不可のISBNでは本のイラストへのフォールバックも確認しました。取得可能な書影の総数は未集計です。キーの値はこの資料・ソース・ブラウザーに含めません。

既にページを開いている場合は、一度再読み込みすると接続可否の判定が更新されます。楽天からの応答・書影URLは保存ルートや静的カタログに保存しません。

売れ筋用の `/api/book-sales` も同じProduction設定を使用します。`server/rakuten-sales.mjs` が対象教科・試験の検索を行い、上流応答を永続保存せず、保存ルートからも販売データを除外します。照合索引の再生成は `python scripts/build-rakuten-catalog.py` です。
