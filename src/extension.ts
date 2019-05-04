import * as vscode from 'vscode';
//import * as Encoding from 'encoding-japanese';

export function activate( context: vscode.ExtensionContext )
{
	const disposables : vscode.Disposable[] = [];
	
//	let wordSeparators =  _getWordSepearators();
	
	disposables.push( vscode.commands.registerTextEditorCommand( 'marukeyex.cursorRightWordStart', ( textEditor, edit ) => {
		_commandCursorRightWordStart( textEditor, edit );
	} ) );
	disposables.push( vscode.commands.registerTextEditorCommand( 'marukeyex.cursorRightWordEnd', ( textEditor, edit ) => {
		_commandCursorRightWordEnd( textEditor, edit );
	} ) );
	disposables.push( vscode.commands.registerTextEditorCommand( 'marukeyex.cursorLeftWordStart', ( textEditor, edit ) => {
		_commandCursorLeftWordStart( textEditor, edit );
	} ) );
	disposables.push( vscode.commands.registerTextEditorCommand( 'marukeyex.cursorLeftWordEnd', ( textEditor, edit ) => {
		_commandCursorLeftWordEnd( textEditor, edit );
	} ) );
	disposables.push( vscode.commands.registerTextEditorCommand( 'marukeyex.deleteRightWord', ( textEditor, edit ) => {
		_commandDeleteRightWord( textEditor, edit );
	} ) );
	disposables.push( vscode.commands.registerTextEditorCommand( 'marukeyex.copyWord', ( textEditor, edit ) => {
		_commandCopyWord( textEditor, edit );
	} ) );
	disposables.push( vscode.commands.registerTextEditorCommand( 'marukeyex.enter', ( textEditor, edit ) => {
		_commandEnter( textEditor, edit );
	} ) );
	
	context.subscriptions.concat( disposables );
}

export function deactivate() {}

function _commandCursorRightWordStart( editor : vscode.TextEditor, edit : vscode.TextEditorEdit )
{
	let pos = _findRightWordPosInEditor( editor, editor.selection.active, false );
	_cursorMovePos( editor, pos );
}

export function _commandCursorRightWordEnd( editor : vscode.TextEditor, edit : vscode.TextEditorEdit )
{
	let pos = _findRightWordPosInEditor( editor, editor.selection.active, true );
	_cursorMovePos( editor, pos );
}

function _commandCursorLeftWordStart( editor : vscode.TextEditor, edit : vscode.TextEditorEdit )
{
	let pos = _findLeftWordPosInEditor( editor, editor.selection.active, false );
	_cursorMovePos( editor, pos );
}

function _commandCursorLeftWordEnd( editor : vscode.TextEditor, edit : vscode.TextEditorEdit )
{
	let pos = _findLeftWordPosInEditor( editor, editor.selection.active, true );
	_cursorMovePos( editor, pos );
}

function _commandDeleteRightWord( editor : vscode.TextEditor, edit : vscode.TextEditorEdit )
{
	let lineCnt = editor.document.lineCount;
	let pos = editor.selection.active;
	let lineText = editor.document.lineAt( pos );
	
	// 行末は改行を除去
	if( pos.character === lineText.range.end.character ){
		// ファイル終端
		if( pos.line + 1 >= lineCnt ){
			return;
		}
		
		pos = new vscode.Position( pos.line + 1, 0 );
	}
	else {
		let characterPos = pos.character;
		let type = _getCharTypeAt( lineText.text, characterPos );
		
		if( _checkSkipCursorMoveChar( type ) ){
			characterPos	= _skipRightWhiteSpaceAndPunctuation( lineText.text, characterPos );
		}
		else {
			characterPos	= _skipRightCurrentWordType( lineText.text, characterPos );
		}
		
		pos	= new vscode.Position( pos.line, characterPos );
	}
	
	edit.delete( new vscode.Range( editor.selection.anchor, pos ) );
	
	_cursorMovePos( editor, editor.selection.anchor );
}

function _commandCopyWord( editor : vscode.TextEditor, edit : vscode.TextEditorEdit )
{
	let lineCnt = editor.document.lineCount;
	let pos = editor.selection.active;
	let lineText = editor.document.lineAt( pos );
	
	let leftPos = _skipLeftCurrentWordType( lineText.text, pos.character );
	let rightPos = _skipRightCurrentWordType( lineText.text, pos.character );
	
	let str = lineText.text.substr( leftPos, rightPos - leftPos );
	
	vscode.env.clipboard.writeText( str );
	
	vscode.window.setStatusBarMessage( "Copied word.", 1000 );
}

function _commandEnter( editor : vscode.TextEditor, edit : vscode.TextEditorEdit )
{
	vscode.commands.executeCommand( "lineBreakInsert" ).then( () => {
		let pos = editor.selection.active;
		let lineText = editor.document.lineAt( pos.line + 1 );
		
		let chIdx = _findRightWordPos( lineText.text, 0, CharType.WhiteSpace as number );
		
		pos	= new vscode.Position( pos.line + 1, chIdx );
		
		editor.selection	= new vscode.Selection( pos, pos );
		
		if( editor.selections.length === 1 ){
			editor.revealRange( editor.selection );
		}
	} );
}

const enum CharType {
	WhiteSpace			= ( 1 << 0 ),
	NewLine				= ( 1 << 1 ),
	AlphabetNumber		= ( 1 << 2 ),
	Hiragana			= ( 1 << 3 ),
	Katakana			= ( 1 << 4 ),
	Punctuation			= ( 1 << 5 ),
	Other				= ( 1 << 6 ),
	
	SkipCursorMove		= WhiteSpace | Punctuation,
}

function _checkSkipCursorMoveChar( charType: CharType ): boolean
{
	return ( ( ( charType as number ) & ( CharType.SkipCursorMove as number ) ) !== 0 );
}

function _findRightWordPos( str: string, startIdx: number, ignoreCharType: number ): number
{
	let	len = str.length;
	
	for( let chIdx = startIdx; chIdx < len; ++chIdx ){
		let type = _getCharTypeAt( str, chIdx ) as number;
		
		if( ( type & ignoreCharType ) === 0 ){
			return chIdx;
		}
	}
	
	return len;
}

function _findLeftWordPos( str: string, startIdx: number, ignoreCharType: number ): number
{
	for( let chIdx = startIdx; chIdx >= 0; --chIdx ){
		let type = _getCharTypeAt( str, chIdx ) as number;
		
		if( ( type & ignoreCharType ) === 0 ){
			return chIdx + 1;
		}
	}
	
	return 0;
}

function _skipRightWhiteSpaceAndPunctuation( str: string, chIdx: number ) : number
{
	let type = _getCharTypeAt( str, chIdx );
	
	if( _checkSkipCursorMoveChar( type ) ){
		let ignoreCharType = CharType.SkipCursorMove as number;
		
		chIdx	= _findRightWordPos( str, chIdx + 1, ignoreCharType );
	}
	
	return chIdx;
}

function _skipRightCurrentWordType( str: string, chIdx: number ) : number
{
	let type = _getCharTypeAt( str, chIdx );
	let ignoreCharType = type as number;
	
	return  _findRightWordPos( str, chIdx + 1, ignoreCharType );
}

function _skipLeftWhiteSpaceAndPunctuation( str: string, chIdx: number ) : number
{
	let type = _getCharTypeAt( str, chIdx );
	
	if( _checkSkipCursorMoveChar( type ) ){
		let ignoreCharType = CharType.SkipCursorMove as number;
		
		chIdx	= _findLeftWordPos( str, chIdx - 1, ignoreCharType );
	}
	
	return chIdx;
}

function _skipLeftCurrentWordType( str: string, chIdx: number ) : number
{
	let type = _getCharTypeAt( str, chIdx );
	let ignoreCharType = type as number;
	
	return  _findLeftWordPos( str, chIdx - 1, ignoreCharType );
}

function _findRightWordPosInEditor( editor: vscode.TextEditor, pos: vscode.Position, isWordEnd: boolean ): vscode.Position
{
	let lineCnt = editor.document.lineCount;
	let lineIdx = pos.line;
	let chIdx = pos.character;
	let lineText = editor.document.lineAt( lineIdx );
	
	// 単語先端へのスキップなら現在の単語終端へ
	if( !isWordEnd && chIdx < lineText.range.end.character ){
		let curType = _getCharTypeAt( lineText.text, chIdx );
		if( !_checkSkipCursorMoveChar( curType ) ){
			chIdx	= _skipRightCurrentWordType( lineText.text, chIdx );
		}
	}
	
	// 現在の文字が空白か改行なら全てスキップして次単語の先頭に移動
	while( true ){
		// 行末は次の行の先頭へ一旦移動
		if( chIdx === lineText.range.end.character ){
			// ファイル終端
			if( lineIdx === lineCnt - 1 ){
				break;
			}
			
			++lineIdx;
			lineText = editor.document.lineAt( lineIdx );
			chIdx	= 0;
		}
		else {
			let curType = _getCharTypeAt( lineText.text, chIdx );
			if( _checkSkipCursorMoveChar( curType ) ){
				chIdx	= _skipRightWhiteSpaceAndPunctuation( lineText.text, chIdx );
			}
			else {
				break;
			}
		}
	}
	
	if( isWordEnd && chIdx < lineText.range.end.character ){
		chIdx	= _skipRightCurrentWordType( lineText.text, chIdx );
	}
	
	return new vscode.Position( lineIdx, chIdx );
}

function _findLeftWordPosInEditor( editor: vscode.TextEditor, pos: vscode.Position, isWordEnd: boolean ): vscode.Position
{
	let lineIdx = pos.line;
	let chIdx = pos.character;
	let lineText = editor.document.lineAt( lineIdx );
	
	// 単語終端へのスキップなら現在の単語先頭へ
	if( isWordEnd && chIdx > 0){
		let prevType = _getCharTypeAt( lineText.text, chIdx - 1 );
		if( !_checkSkipCursorMoveChar( prevType ) ){
			chIdx	= _skipLeftCurrentWordType( lineText.text, chIdx - 1 );
		}
	}
	
	// 直前の文字が空白か改行なら全てスキップして前単語の直後に移動
	while( true ){
		// 行頭は前の行の終端文字へ一旦移動
		if( chIdx === 0 ){
			// ファイル先端
			if( lineIdx === 0 ){
				break;
			}
			
			--lineIdx;
			lineText = editor.document.lineAt( lineIdx );
			chIdx	= lineText.range.end.character;
		}
		else {
			let prevType = _getCharTypeAt( lineText.text, chIdx - 1 );
			if( _checkSkipCursorMoveChar( prevType ) ){
				chIdx	= _skipLeftWhiteSpaceAndPunctuation( lineText.text, chIdx - 1 );
			}
			else {
				break;
			}
		}
	}
	
	if( !isWordEnd && chIdx > 0 ){
		chIdx	= _skipLeftCurrentWordType( lineText.text, chIdx - 1 );
	}
	
	return new vscode.Position( lineIdx, chIdx );
}

function _getWordSepearators() : string | undefined
{
	let editor = vscode.window.activeTextEditor;
	if( editor === undefined ){
		return undefined;
	}
	
	let config = vscode.workspace.getConfiguration( "editor", editor.document.uri );
	if( config === undefined ){
		return undefined;
	}
	
	return config.get( "wordSeparators" );
}

function _cursorMovePos( editor: vscode.TextEditor, pos: vscode.Position )
{
	if( editor.selection.isEmpty ){
		editor.selection	= new vscode.Selection( pos, pos );
	}
	else {
		editor.selection	= new vscode.Selection( editor.selection.anchor, pos );
	}
	
	if( editor.selections.length === 1 ){
		editor.revealRange( editor.selection );
	}
}

function _getCharType( ch: number ) : CharType
{
	// WhiteSpace
	if( ch === 0x000a ){							// \n
		return CharType.NewLine;
	}
	else if( ch === 0x0020							// ' '
	 		|| ( 0x0009 <= ch && ch <= 0x000d )		// \t, \v, \f, \r
			|| ch === 0x00a0 || ch === 0x1680 || ch === 0x180e || ( 0x2000 <= ch && ch <= 0x200a )
			|| ch === 0x2028 || ch === 0x2029 || ch === 0x202f || ch === 0x205f || ch === 0x3000 || ch === 0xfeff ){
		return CharType.WhiteSpace;
	}
	else if( ( 0x0030 <= ch && ch <= 0x0039 )		// 0 - 9
			|| ch === 0x005f						// _
			|| ( 0x0041 <= ch && ch <= 0x005a )		// A - Z
			|| ( 0x0061 <= ch && ch <= 0x007a )		// a - z
			|| ( 0xff10 <= ch && ch <= 0xff5a )		// ０ - ｚ
			|| ch === 0xff3f						// ＿
			|| ( 0x0391 <= ch && ch <= 0x044f )		// Α - я
	){
		return CharType.AlphabetNumber;
	}
	else if( ( 0x0000 <= ch && ch <= 0x007e )		// 他ASCIIコード
			|| ch === 0x203e						// ‾
			|| ( 0x2500 <= ch && ch <= 0x2542 )		// ─ - ╂
	){
		return CharType.Punctuation;
	}
	else if( ( 0x3041 <= ch && ch <= 0x3093 ) ){	// ぁ - ん
		return CharType.Hiragana;
	}
	else if( ( 0x30a1 <= ch && ch <= 0x30f6 )		// ァ - ヶ
			|| ( 0xff66 <= ch && ch <= 0xFF9F )		// ヲ - ゜
	){
		return CharType.Katakana;
	}
	
	return CharType.Other;
}

function _getCharTypeAt( str: string, chIdx: number ): CharType
{
	let	ch = str.charCodeAt( chIdx );
	return _getCharType( ch );
}

