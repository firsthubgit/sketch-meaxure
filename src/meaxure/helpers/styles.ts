// Copyright 2020 Jebbs. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import { BorderData, SMFillData, SMShadow, SMGradient, SMGradientStop, shadowType } from "../interfaces";
import { SMColor } from "../interfaces";
import { sketch } from "../../sketch";

export function getBordersFromStyle(style: Style): BorderData[] {
    let bordersData: BorderData[] = [];
    for (let border of style.borders) {
        if (!border.enabled) continue;
        let fillType = border.fillType;
        let borderData: BorderData = {
            fillType: fillType,
            position: border.position,
            thickness: border.thickness,
            color: undefined,
            gradient: undefined,
        };

        switch (fillType) {
            case sketch.Style.FillType.Color:
                borderData.color = parseColor(border.color);
                if((<any>border).sketchObject != null && (<any>border).sketchObject.color() != null
                    && (<any>border).sketchObject.color().swatchID() != null){
                    let ocstr = (<any>border).sketchObject.color().swatchID().toString()
                    borderData.color.colorID = new String(ocstr).toString();
                } else {
                    borderData.color.colorID = "boder_null";
                }
                break;
            case sketch.Style.FillType.Gradient:
                borderData.gradient = parseGradient(border.gradient);
                break;
            default:
                continue;
        }
        bordersData.push(borderData);
    }
    return bordersData;
}
export function getFillsFromStyle(style: Style): SMFillData[] {
    // console.log("长度：" + style.fills.length)
    let fillsData: SMFillData[] = [];
    for (let fill of style.fills) {
        if (!fill.enabled) continue;
        let fillType = fill.fillType;
        let fillData = <SMFillData>{
            fillType: fillType,
            color: <SMColor>{},
            gradient: <SMGradient>{}
        };
        switch (fillType) {
            case sketch.Style.FillType.Color:
                fillData.color = parseColor(fill.color);
                if((<any>fill).sketchObject != null && (<any>fill).sketchObject.color() != null &&
                (<any>fill).sketchObject.color().swatchID() != null){
                    let ocstr = (<any>fill).sketchObject.color().swatchID().toString()
                    fillData.color.colorID = new String(ocstr).toString();
                } else {
                    fillData.color.colorID = "fill_null"
                }
                break;
            case sketch.Style.FillType.Gradient:
                fillData.gradient = parseGradient(fill.gradient);
                break;
            default:
                continue;
        }
        fillsData.push(fillData);
    }
    return fillsData;
}

export function getShadowsFromStyle(style: Style): SMShadow[] {
    return style.shadows.filter(s => s.enabled).map(s => convertShadow(s, shadowType.outer)).concat(
        ...style.innerShadows.filter(s => s.enabled).map(s => convertShadow(s, shadowType.inner))
    );
}

function convertShadow(shadow: Shadow, type: shadowType): SMShadow {
    return {
        type: type,
        offsetX: shadow.x,
        offsetY: shadow.y,
        blurRadius: shadow.blur,
        spread: shadow.spread,
        color: parseColor(shadow.color)
    };
}

export function parseColor(rgbaHex: string): SMColor {
    if (!rgbaHex) return <SMColor>{};
    let r = parseInt(rgbaHex.substr(1, 2), 16);
    let g = parseInt(rgbaHex.substr(3, 2), 16);
    let b = parseInt(rgbaHex.substr(5, 2), 16);
    let alpha = parseInt(rgbaHex.substr(7, 2), 16);

    let alpha100 = Math.round(alpha / 255 * 100);
    let colorUpperCase = rgbaHex.toUpperCase();
    let hsl = calcHSLColor(r / 255, g / 255, b / 255);
    return {
        colorID : "",
        rgb: {
            r: r,
            g: g,
            b: b,
        },
        hsl: hsl,
        alpha: alpha,
        "color-hex": colorUpperCase.substr(0, 7) + " " + alpha100 + "%",
        "argb-hex": "#" + alpha.toString(16).toUpperCase() + colorUpperCase.substr(1, 6).replace("#", ""),
        "rgba-hex": rgbaHex.toLocaleUpperCase(),
        "css-rgba": `rgba(${r},${g},${b},${alpha100 / 100})`,
        "css-hsla": `hsla(${hsl.h},${hsl.s}%,${hsl.l}%,${alpha100 / 100})`,
        "ui-color": "(" + [
            "r:" + r.toFixed(2),
            "g:" + g.toFixed(2),
            "b:" + b.toFixed(2),
            "a:" + (alpha100 / 100).toFixed(2)
        ].join(" ") + ")"
    };
}

function calcHSLColor(r: number, g: number, b: number): { h: number, s: number, l: number } {
    // https://juejin.im/entry/5cc4670f5188252dcf5d5063
    const rgbToLightness = (r, g, b) => 1 / 2 * (Math.max(r, g, b) + Math.min(r, g, b));
    const rgbToSaturation = (r, g, b) => {
        const L = rgbToLightness(r, g, b);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return (L === 0 || L === 1) ? 0 : (max - min) / (1 - Math.abs(2 * L - 1));
    };
    const rgbToHue = (r, g, b) => Math.round(Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI);
    const lightness = Math.round(rgbToLightness(r, g, b) * 100);
    const saturation = Math.round(rgbToSaturation(r, g, b) * 100);
    let hue = Math.round(rgbToHue(r, g, b));
    if (hue < 0) hue += 360;
    return {
        h: hue,
        s: saturation,
        l: lightness,
    };
}

export function parseGradient(gradient: Gradient): SMGradient {
    return <SMGradient>{
        type: gradient.gradientType,
        from: gradient.from,
        to: gradient.to,
        colorStops: gradient.stops.map(s => {
            // let ocstr = (<any>s).sketchObject.color().swatchID().toString();
            let smColor = parseColor(s.color)
            // smColor.colorID = new String(ocstr).toString()
            return <SMGradientStop>{
                position: s.position,
                color: smColor
            }
        }),
        aspectRatio: gradient.aspectRatio,
    }
}

export function getLayerRadius(layer: Layer): number[] {
    if (layer.type !== sketch.Types.ShapePath) return undefined;
    return (layer as ShapePath).radius;
}

/**
 * Combine multiple colors into an equivalent one. Works with rgba hex-strings (`#000000ff` is opaque black).
 * @param colors colors to merge
 */
function mergeColors(...colors: string[]): string {
    let currentAlpha = 255;
    let red = 0,
        green = 0,
        blue = 0;
    for (let color of colors) {
        let a = parseInt(color.substr(7, 2), 16);
        currentAlpha = currentAlpha * a / 255;
        red = red * (1 - currentAlpha / 255) + parseInt(color.substr(1, 2), 16) * currentAlpha / 255;
        green = green * (1 - currentAlpha / 255) + parseInt(color.substr(3, 2), 16) * currentAlpha / 255;
        blue = blue * (1 - currentAlpha / 255) + parseInt(color.substr(5, 2), 16) * currentAlpha / 255;
    }
    blue = Math.round(blue);
    green = Math.round(green);
    red = Math.round(red);
    currentAlpha = Math.round(currentAlpha);
    return `#${red.toString(16)}${green.toString(16)}${blue.toString(16)}${currentAlpha.toString(16)}`.toUpperCase();
}