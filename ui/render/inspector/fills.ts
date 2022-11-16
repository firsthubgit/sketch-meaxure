import { localize } from "../../common";
import { LayerData } from "../../../src/meaxure/interfaces";
import { colorItem, colorItem2,colorKey, propertyType } from "./shared";
export function renderFills(layerData: LayerData): string {
    if (!layerData.fills || !layerData.fills.length)
        return '';
    var fills = [];
    let fillsData = layerData.fills;
    for (let i = fillsData.length - 1; i >= 0; i--) {
        let fill = fillsData[i];
        if (fill.fillType.toLowerCase() == "color") {
            fills.push('<div class="item" data-label="' + localize(fill.fillType) + ':">');
            fills.push(colorItem(fill.color));
            fills.push('</div>');
            fills.push( '<div class="item" data-label="ARGB:">'+
            '<div class="color">'+
            colorItem2(fill.color)+
            '</div>'+
            '</div>');
            fills.push('<div class="item" data-label="Key :">'+
            colorKey(fill.color)+
            '</div>');
        }
        else {
            fills.push('<div class="item items-group" data-label="' + localize(fill.fillType) + ':">');
            fills.push('<div class="gradient">');
            fill.gradient.colorStops.forEach(gradient => fills.push(colorItem(gradient.color)));
            fills.push('</div>');
            fills.push('</div>');

            fills.push('<div class="item items-group" data-label="' + localize(fill.fillType) + ':">');
            fills.push('<div class="gradient">');
            fill.gradient.colorStops.forEach(gradient => fills.push(colorItem2(gradient.color)));
            fills.push('</div>');
            fills.push('</div>');

            fills.push('<div class="item" data-label="Key :">'+
            '<label><input type="text" value="' + layerData.name + '" readonly="readonly"></label>'+
            '</div>');
        }
    }
    return propertyType('FILLS', fills.join(''));
}
