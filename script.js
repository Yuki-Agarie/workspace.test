// なんとなく一行開けておきたい病気
const statusLines=document.getElementById("statusLines");	// ステータス行数
const statusChars=document.getElementById("statusChars");	// ステータス文字数
const fileName=document.getElementById("fileName");
const savedFileName=localStorage.getItem("fileName");	// キャッシュ保存ファイル名
const statusFileName=document.getElementById("statusFileName");	// ステータスファイル名

const fontSize=document.getElementById("fontSize");
fontSize.onchange=()=>{
    editor.style.fontSize=fontSize.value+"px";
lineNumbers.style.fontSize=fontSize.value+"px";
};

const autoSave=document.getElementById("autoSave");

const encoding=document.getElementById("encoding");
const newline=document.getElementById("newline");

const editor=document.getElementById("editor");
const lineNumbers=document.getElementById("lineNumbers");

const savedNewline=localStorage.getItem("newline");
const savedFontSize=localStorage.getItem("fontSize");

const jumpLine=document.getElementById("jumpLine");
const jumpButton=document.getElementById("jumpButton");

// オートセーブon,offスイッチ
const autoSaveState=localStorage.getItem("autoSave");	// キャッシュセーブフラグ

if(autoSaveState!==null){
autoSave.checked=(autoSaveState==="true");
}

autoSave.addEventListener("change",()=>{
    localStorage.setItem(
        "autoSave",
        autoSave.checked
    );
});

// ファイル名表示
function updateFileName(){
    statusFileName.textContent=
        "ファイル名: "+fileName.value;
}

// 保存タイトル復元
if(savedFileName!==null){
    fileName.value=savedFileName;
}
updateFileName();

// ファイル名を変更時に保存
fileName.addEventListener("input",()=>{
    localStorage.setItem(
        "fileName",
        fileName.value
    );
    updateFileName();
});

// Undo・Redo処理
const undoButton=document.getElementById("undoButton");
const redoButton=document.getElementById("redoButton");

const undoStack=[];
const redoStack=[];

function saveUndo(){
    undoStack.push({
        text:editor.value,
        start:editor.selectionStart,
        end:editor.selectionEnd
    });
    redoStack.length=0;
}

// 追加
function detectEncoding(bytes){

    // UTF-8 BOM
    if(
        bytes.length >= 3 &&
        bytes[0] === 0xEF &&
        bytes[1] === 0xBB &&
        bytes[2] === 0xBF
    ){
        return "UTF-8";
    }

    // UTF-16 LE BOM
    if(
        bytes.length >= 2 &&
        bytes[0] === 0xFF &&
        bytes[1] === 0xFE
    ){
        return "UTF-16 LE";
    }

    // UTF-16 BE BOM
    if(
        bytes.length >= 2 &&
        bytes[0] === 0xFE &&
        bytes[1] === 0xFF
    ){
        return "UTF-16 BE";
    }

    // UTF-8妥当性チェック
    try{

        const decoder=new TextDecoder(
            "utf-8",
            {fatal:true}
        );

        decoder.decode(bytes);

        return "UTF-8";

    }catch(e){

        return "不明";

    }

}

// ローカルストレージ保存
function saveLocal(){

if(!autoSave.checked){
    return;
}

    localStorage.setItem(
        "editorText",
        editor.value
    );

    localStorage.setItem(
        "newline",
        newline.value
    );

localStorage.setItem(
    "fontSize",
    fontSize.value
);

}

// 追加
function detectNewline(text){

    if(text.includes("\r\n")){
        return "CRLF";
    }

    if(text.includes("\n")){
        return "LF";
    }

    return "-";

}

// ローカルストレージ復元
const savedText=localStorage.getItem("editorText");

if(savedText!==null){

    editor.value=savedText;

}

if(savedNewline!==null){

    newline.value=savedNewline;

}

if(savedFontSize){
    fontSize.value=savedFontSize;

    editor.style.fontSize=savedFontSize+"px";
  lineNumbers.style.fontSize=savedFontSize+"px";
}

// 行番号指定ジャンプ
jumpButton.onclick=()=>{

    const line=Number(
        jumpLine.value
    );

    if(line<1){
        return;
    }

    const lines=editor.value.split("\n");

    if(line>lines.length){
        return;
    }

    let pos=0;

    for(let i=0;i<line-1;i++){
        pos+=lines[i].length+1;
    }

    const lineHeight=
        parseFloat(getComputedStyle(editor).lineHeight);

    const visibleLines=
        editor.clientHeight/lineHeight;

    editor.scrollTop=
        Math.max(
            0,
            (line-1-visibleLines/2)*lineHeight
        );

    editor.setSelectionRange(pos,pos);
    editor.focus();

    jumpLine.value="";
};

// Enterキーでもジャンプ
jumpLine.addEventListener("keydown",e=>{

    if(e.key==="Enter"){
        e.preventDefault();
        e.stopPropagation();

        jumpButton.click();
    }
});

// オールクリア
document.getElementById("clearButton").onclick=()=>{

//    if(!confirm("内容をすべて削除しますか？")){
//        return;
//    }

    saveUndo();
    editor.value="";

 lineNumbers.scrollTop=0;
 editor.scrollTop=0;

    updateLineNumbers();
    saveLocal();
    editor.focus();
};

// トップ
document.getElementById("topButton").onclick=()=>{

    editor.setSelectionRange(0,0);

    editor.focus();

};

// ボトム
document.getElementById("bottomButton").onclick=()=>{

    const end=editor.value.length;

    editor.setSelectionRange(end,end);

    editor.focus();

};

function updateLineNumbers(){

    const count=editor.value.split("\n").length;

    let numbers="";

    for(let i=1;i<=count;i++){
        numbers+=i+"\n";
    }

    lineNumbers.textContent=numbers;

    statusLines.textContent="行: "+count;
    statusChars.textContent="文字:"+editor.value.length;

}

editor.addEventListener("input",()=>{

    updateLineNumbers();

    saveLocal();

});

editor.addEventListener("scroll",()=>{

    lineNumbers.scrollTop=editor.scrollTop;

});

newline.addEventListener("change",saveLocal);

updateLineNumbers();

const fileInput=document.getElementById("fileInput");

// 開く
document.getElementById("openButton").onclick=()=>{
    fileInput.click();
};

fileInput.addEventListener("change",e=>{

    const file=e.target.files[0];
    if(!file)return;

fileName.value=file.name;
updateFileName();

    const reader=new FileReader();

 reader.onload=()=>{

    const buffer=reader.result;

    const bytes=new Uint8Array(buffer);

    const enc=detectEncoding(bytes);

saveUndo();

    encoding.textContent=enc;

if(enc==="不明"){
        const decoder=new TextDecoder("shift-jis");
	const text=decoder.decode(bytes);
        editor.value=text;
        encoding.textContent="Shift_JIS（指定）";
		newline.value=detectNewline(text);
		updateLineNumbers();
		saveLocal();

	   return;
}

//    if(confirm(
//        "文字コードを判別できませんでした。\n\nShift_JISとして開きますか？"
//    )){
//        const decoder=new TextDecoder("shift-jis");
//        const text=decoder.decode(bytes);
//        editor.value=text;
//        encoding.textContent="Shift_JIS（指定）";
//        newline.value=detectNewline(text);
//        updateLineNumbers();
//	saveLocal();
//    }
//   return;
//}

    let decoder;

    switch(enc){

        case "UTF-16 LE":
            decoder=new TextDecoder("utf-16le");
            break;

        case "UTF-16 BE":
            decoder=new TextDecoder("utf-16be");
            break;

        default:
            decoder=new TextDecoder("utf-8");
            break;

    }

    const text=decoder.decode(bytes);

    editor.value=text;

  newline.value=detectNewline(text);

    updateLineNumbers();

saveLocal();

};

reader.readAsArrayBuffer(file);

});

// 保存
document.getElementById("saveButton").onclick=()=>{

//    if(
//        !confirm(
//            "保存されるファイルはUTF-8として保存されます。\n\n続行しますか？"
//        )
//    ){
//        return;
//    }

let saveText=editor.value;

if(newline.value==="CRLF"){

    saveText=saveText.replace(/\r?\n/g,"\r\n");

}else{

    saveText=saveText.replace(/\r?\n/g,"\n");

}

const blob=new Blob(
    [saveText],
        {
            type:"text/plain;charset=utf-8"
        }
    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;
a.download=fileName.value;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

};

// Home
document.getElementById("homeButton").onclick=()=>{

    const pos=editor.selectionStart;

    const lineStart=editor.value.lastIndexOf("\n",pos-1)+1;

    editor.setSelectionRange(lineStart,lineStart);

    editor.focus();

};

// End
document.getElementById("endButton").onclick=()=>{

    const pos=editor.selectionStart;

    let lineEnd=editor.value.indexOf("\n",pos);

    if(lineEnd===-1){
        lineEnd=editor.value.length;
    }

    editor.setSelectionRange(lineEnd,lineEnd);

    editor.focus();

};

// ボタンのやり直し
redoButton.onclick=()=>{
    if(redoStack.length===0){
        return;
    }
    undoStack.push({
        text:editor.value,
        start:editor.selectionStart,
        end:editor.selectionEnd
    });
    const state=redoStack.pop();

    editor.value=state.text;
    editor.setSelectionRange(
        state.start,
        state.end
    );
    updateLineNumbers();
    saveLocal();
    editor.focus();
};

// ボタンの元に戻す
undoButton.onclick=()=>{
    if(undoStack.length===0){
        return;
    }

redoStack.push({
    text:editor.value,
    start:editor.selectionStart,
    end:editor.selectionEnd
});

    const state=undoStack.pop();
    editor.value=state.text;
    editor.setSelectionRange(
        state.start,
        state.end
    );
    updateLineNumbers();
    saveLocal();
    editor.focus();
};

// TAB挿入のみ
document.getElementById("tabButton").onclick=()=>{

    if(editor.selectionStart!==editor.selectionEnd){
        return;
    }

    const pos=editor.selectionStart;

    saveUndo();

    editor.setRangeText(
        "\t",
        pos,
        pos,
        "end"
    );

saveLocal();
    editor.focus();
updateLineNumbers();

};

// Shift+TAB行頭のみ
document.getElementById("untabButton").onclick=()=>{

    if(editor.selectionStart!==editor.selectionEnd){
        return;
    }

    const pos=editor.selectionStart;

    const text=editor.value;

    const lineStart=text.lastIndexOf("\n",pos-1)+1;

    if(text.charAt(lineStart)==="\t"){

    saveUndo();

        editor.setRangeText(
            "",
            lineStart,
            lineStart+1,
            "start"
        );
saveLocal();
    }
    editor.focus();
updateLineNumbers();
};

// カーソル前TAB削除
document.getElementById("deleteTabButton").onclick=()=>{
    if(editor.selectionStart!==editor.selectionEnd){
        return;
    }

    const pos=editor.selectionStart;

    if(pos===0){
        return;
    }
    if(editor.value.charAt(pos-1)!=="\t"){
        return;
    }
    saveUndo();
    editor.setRangeText(
        "",
        pos-1,
        pos,
        "end"
    );
    saveLocal();
    updateLineNumbers();
    editor.focus();
};