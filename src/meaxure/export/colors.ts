// Copyright 2020 Jebbs. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import { sketch } from "../../sketch";
import { SMColorAsset } from "../interfaces";
import { parseColor } from "../helpers/styles";

export let allSwats = []
export let allSwatsDic : {[key:string]:any} = {};

export function getDocumentColors(document: Document): SMColorAsset[] {
    let swatches = sketch.getSelectedDocument().sketchObject.documentData().allSwatches()
    let sw = [];
    swatches.forEach(swt => {
        let localSwt = sketch.Swatch.from(swt)
        sw.push(localSwt);
        allSwats.push(localSwt)
    });  
    if (sw && sw.length)return sw.map(s => {
        let swid = s.referencingColor.swatchID();
        var jsStr = ""
        if(swid != null){
            jsStr = new String(swid.toString()).toString();
        } else {
            jsStr = "swatcher null"
        }
        allSwatsDic[jsStr] = s;
        let sSMColorAsset = {
            name: s.name,
            color: parseColor(s.color),
            colorID : jsStr
        }

        sSMColorAsset.color.colorID = jsStr;
        return sSMColorAsset;
    });
        return document.colors.map(swatche => ({
        name: swatche.name,
        color: parseColor(swatche.color),
        colorID : ''
    }));
}