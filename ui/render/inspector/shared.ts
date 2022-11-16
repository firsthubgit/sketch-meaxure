import { state } from "../../common";
import { localize, project } from "../../common";
import { SMColor } from "../../../src/meaxure/interfaces";
export function colorItem(color: SMColor): string {
    var colorName = (project.colorNames) ? project.colorNames[color.colorID] : '';
    if(colorName != null){
        var splitStr = colorName.split(/:/);
        colorName = splitStr.length>0 ? splitStr[0] : ""
    } else {
        colorName = ""
    }
    colorName = (colorName) ? ' data-name="' + colorName + '"' : '';
    return [
        '<div class="color">',
        '<label><em><i style="background-color:' + color['css-rgba'] + ';"></i></em></label><input data-color="' + encodeURI(JSON.stringify(color)) + '" type="text" value="' + color[state.colorFormat] + '" readonly="readonly">',
        '</div>'
    ].join('');
}

export function colorItem2(color: SMColor): string {
    return [
        '<div class="color">',
        '<label><em><i style="background-color:' + color['css-rgba'] + ';"></i></em></label><input data-color="' + encodeURI(JSON.stringify(color)) + '" type="text" value="' + color['argb-hex'] + '" readonly="readonly">',
        '</div>'
    ].join('');
}

export function colorKey(color: SMColor): string {
    console.log("colorID ：" + color.colorID)
    var colorName = (project.colorNames) ? project.colorNames[color.colorID] : '';
    console.log("colorName ：" + colorName)
    if(colorName != null){
        var splitStr2 = colorName.split(/:/);
        colorName = splitStr2.length>0 ? splitStr2[0] : ""
    } else {
        colorName = ""
    }

    if(colorName){
        var keys = colorName.split("/");
        if(keys.length > 0){
            colorName = keys[keys.length - 1];
        } else {
            colorName = colorName;
        }
        // if(keys.length == 1){
        //     colorName = keys[0];
        // } else if(keys.length == 2){
        //     colorName = keys[1];
        // }
    } else {
        colorName = '未定义'
    }
    return [
        '<label><input type="text" value="' + colorName + '" readonly="readonly"></label>'
    ].join('');
}


export function propertyType(title: string, content: string, isCode?: boolean) {
    var nopadding = isCode ? ' style="padding:0"' : '';
    return ['<section>',
        '<h3>' + localize(title) + '</h3>',
        '<div class="context"' + nopadding + '>',
        content,
        '</div>',
        '</section>'
    ].join('');
}
