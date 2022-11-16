// Copyright 2020 Jebbs. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import { exportPanel } from "../panels/exportPanel";
import { sketch } from "../../sketch";
import { localize, getAllLanguage } from "../common/language";
import { context } from "../common/context";
import { createWebviewPanel } from "../../webviewPanel";
import { toHTMLEncode, newStopwatch, toSlug, emojiToEntities, getResourcePath } from "../helpers/helper";
import { writeFile, buildTemplate, exportImage, exportImageToBuffer } from "./files";
import { logger } from "../common/logger";
import { ExportData, ArtboardData } from "../interfaces";
import { getLayerData } from "./layerData";
import { clearSliceCache, getCollectedSlices } from "./slice";
import { clearMaskStack } from "./mask";
import { getDocumentColors } from "./colors";
import { clearTintStack, TintInfo } from "./tint";
import { tempLayers } from "./tempLayers";
import { LayerPlaceholder } from "./layers";

export let savePath: string;
export let assetsPath: string;
export let stopwatch = newStopwatch();

export async function exportSpecification() {

    const RUNNING_FLAG_KEY = "co.jebbs.sketch-meaxure.exporting"
    if (sketch.Settings.sessionVariable<boolean>(RUNNING_FLAG_KEY)) {
        sketch.UI.message(localize('Please wait for former task to exit'));
        return;
    }
    //results selection :{ children , artboard}
    let results = await exportPanel();
    if (!results) return;
    if (results.selection.length <= 0) return false;
    let document = context.document;
    savePath = sketch.UI.savePanel(
        localize("Export spec"),
        localize("Export to:"),
        localize("Export"),
        true,
        document.fileName
    );
    if (!savePath) return;
    assetsPath = savePath + "/assets";

    sketch.Settings.setSessionVariable<boolean>(RUNNING_FLAG_KEY, true);
    stopwatch.restart();
    clearMaskStack();
    // stopwatch.tik('clearMaskStack');
    clearTintStack();
    // stopwatch.tik('clearTintStack');
    clearSliceCache();
    // stopwatch.tik('clearSliceCache');
    let processingPanel = createWebviewPanel({
        url: getResourcePath() + "/panel/processing.html",
        width: 304,
        height: 104,
    });
    processingPanel.onClose(() => cancelled = true);
    processingPanel.show();
    // stopwatch.tik('processingPanel');
    let onFinishCleanup = function () {
        tempLayers.removeAll();
        sketch.Settings.setSessionVariable<boolean>(RUNNING_FLAG_KEY, false);
        processingPanel.close();
    }
    let template = NSString.stringWithContentsOfFile_encoding_error(getResourcePath() + "/template.html", 4, nil);
    let data: ExportData = {
        resolution: context.configs.resolution,
        unit: context.configs.units,
        colorFormat: context.configs.format,
        artboards: [],
        slices: [],
        colors: getDocumentColors(document),
        languages: getAllLanguage(),
    };
    // stopwatch.tik('load template');

    let cancelled = false;
    let layerIndex = 0;
    for (let i = 0; i < results.selection.length; i++) {
        let select = results.selection[i];
        let artboard = select.artboard;
        let page = artboard.parent as Page;
        let fileName = toSlug(page.name + ' ' + (artboard.index + 1) + ' ' + artboard.name);
        console.log('filename :' + fileName)
        data.artboards[i] = <ArtboardData>{
            notes: [],
            layers: [],
        };
        data.artboards[i].pageName = toHTMLEncode(emojiToEntities(page.name));
        data.artboards[i].pageObjectID = page.id;
        data.artboards[i].name = toHTMLEncode(emojiToEntities(artboard.name));
        data.artboards[i].slug = fileName
        data.artboards[i].objectID = artboard.id;
        data.artboards[i].width = artboard.frame.width;
        data.artboards[i].height = artboard.frame.height;
        data.artboards[i].flowStartPoint = artboard.flowStartPoint;
        // stopwatch.tik('collect artboards info');
        for (let layer of select.children) {
            layerIndex++;
            if (cancelled) {
                onFinishCleanup();
                sketch.UI.message(localize('Cancelled by user'));
                return;
            }
            // stopwatch.tik('renameIfIsMarker');
            let taskError: Error;
            // stopwatch.tik('before promise');
            await getLayerTask(artboard, layer, data.artboards[i], results.byInfluence)
                .catch(err => taskError = err);
            if (taskError) {
                onFinishCleanup();
                if (!(layer instanceof LayerPlaceholder)) {
                    // select the error layer
                    document.selectedLayers.layers = [layer];
                    let msg = `Error processing layer ${layer.name}.`;
                    logger.error(msg, taskError);
                } else {
                    logger.error(taskError);
                }
                return;
            }
            // stopwatch.tik('after promise');
            // post messages after an async task, 
            // so that processingPanel has time to initialize,
            // or we get a promise reject of reply timeout.
            processingPanel.postMessage('process', {
                percentage: Math.round(layerIndex / results.layersCount * 100),
                text: localize("振东~~正在快马加班导出中 %@ of %@", layerIndex, results.layersCount)
            });
            // stopwatch.tik('show process');
        }
        if (results.advancedMode) {
            console.log("11111");
            exportArtboardAdvanced(artboard, data, savePath, i);
        } else {
            console.log("222222");
            exportArtboard(artboard, data, i, savePath, template);
        }
        // stopwatch.tik('export artboard');
    }
    data.slices = getCollectedSlices();


    let selectingPath = savePath;
    
    if (results.advancedMode) {
        writeFile({
            content: buildTemplate(template, data),
            path: savePath,
            fileName: "index.html"
        });
        writeFile({
            content: '<meta http-equiv="refresh" content="0;url=index.html#p">',
            path: savePath,
            fileName: "proto.html"
        });
        selectingPath = savePath + "/index.html";
    }
    // stopwatch.tik('generate index.html');
    onFinishCleanup();
    sketch.UI.showFiles([selectingPath]);
    sketch.UI.message(localize("导出成功! Takes %@ seconds", stopwatch.elpased() / 1000));
    // let statistics = stopwatch.statistics()
    // sketch.UI.alert('statistics', Object.keys(statistics).map(key => `${key}: ${statistics[key] / 1000}s`).join('\n'))
}

function getLayerTask(artboard: Artboard, layer: Layer | LayerPlaceholder, data: ArtboardData, byInfluence: boolean, symbolLayer?: Layer): Promise<boolean> {
    return new Promise<true>((resolve, reject) => {
        try {
            getLayerData(artboard, layer, data, byInfluence, symbolLayer)
        } catch (error) {
            reject(error)
        }
        resolve(true);
    });
}

function exportArtboardAdvanced(artboard: Artboard, data: ExportData, savePath: string, i: number) {
    // data.artboards[artboardIndex].imagePath = "preview/" + objectID + ".png";
    data.artboards[i].imagePath = "preview/" + encodeURI(data.artboards[i].slug) + ".png";
    data.artboards[i].imageIconPath = "preview/icons/" + encodeURI(data.artboards[i].slug) + ".png";
    exportImage(
        artboard,
        {
            format: 'png',
            // always export @2x (logic points * 2)
            // if design resolution @2x, we export as is (scale=1)
            // if design resolution @4x, we export half size (scale=0.5)
            scale: 2 / data.resolution,
            prefix: "",
            suffix: "",
        },
        savePath + "/preview", data.artboards[i].slug
    );

    exportImage(artboard, {
        format: 'png',
        // scale: 300 / Math.max(data.artboards[i].width, data.artboards[i].height),
        scale: 0.5,
        prefix: "",
        suffix: "",
    }, savePath + "/preview/icons", data.artboards[i].slug);

    writeFile({
        content: "<meta http-equiv=\"refresh\" content=\"0;url=../index.html#" + i + "\">",
        path: savePath + "/links",
        fileName: data.artboards[i].slug + ".html"
    });
}

function exportArtboard(artboard: Artboard, exportData: ExportData, index: number, savePath: string, template: string) {
    let data = JSON.parse(JSON.stringify(exportData.artboards[index]));

    let imageBase64 = exportImageToBuffer(
        artboard,
        {
            format: 'png',
            // always export @2x (logic points * 2)
            // if design resolution @2x, we export as is (scale=1)
            // if design resolution @4x, we export half size (scale=0.5)
            scale: 2 / exportData.resolution,
            prefix: "",
            suffix: "",
        }
    ).toString('base64');

    data.imageBase64 = 'data:image/png;base64,' + imageBase64;
    let newData = <ExportData>{
        resolution: exportData.resolution,
        unit: exportData.unit,
        colorFormat: exportData.colorFormat,
        artboards: [data],
        slices: [],
        colors: [],
        languages: exportData.languages,
    };
    writeFile({
        content: buildTemplate(template, newData),
        path: savePath,
        fileName: data.slug + ".html"
    });
}
