# marukeyex README

常用している秀丸に比べてVS Codeは日本語編集に不便なことが多いので個人的にあって欲しい機能を追加しています。

## Features

単語単位でのカーソル挙動を拡張。
ひらがな／カタカナ／漢字のそれぞれ固まりを単語とみなします。
空白及び記号は飛ばしてカーソルが移動するので編集したい位置へのカーソル移動が高速化されて作業が捗ります。
左右単語の先頭に移動するコマンドをカーソル移動の基本操作とするのがおすすめ。

## Requirements

(none)

## Extension Settings

* `marukeyex.cursorRightWordStart`: カーソルを右の単語の先頭に移動。
* `marukeyex.cursorRightWordEnd`: カーソルを右の単語の終端に移動。
* `marukeyex.cursorLeftWordStart`: カーソルを左の単語の先頭に移動。
* `marukeyex.cursorLeftWordEnd`: カーソルを左の単語の終端に移動。
* `marukeyex.deleteRightWord`: 単語のカーソル位置から右側を削除。
* `marukeyex.copyWord`: カーソル位置の単語をコピー。
* `marukeyex.enter`: ENTERキーの挙動を他のキーにバインドするコマンドが標準で存在しないので作った。
* `marukeyex.deleteLine`: 行削除。ファイル終端行では行を空にするだけ。

## Known Issues

(none)

## ToDo

- 範囲選択系がVS Codeは扱いにくいのでなんとかしたい。
- 秀丸のキーボードマクロが欲しい。
- 標準のFind機能使いにくいので秀丸プラグインのGrep & Replaceみたいなのが欲しい…。


-----------------------------------------------------------------------------------------------------------

要望等あれば Twitter: @maruru_h まで。
