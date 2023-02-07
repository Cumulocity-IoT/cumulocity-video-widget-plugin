/**
 * /*
 * Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @format
 */

import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Realtime } from '@c8y/ngx-components/api';
import * as _ from 'lodash';

var Hls = require('hls.js');


@Component({
    selector: "lib-cumulocity-video-widget",
    templateUrl: "./cumulocity-video-widget.component.html",
    styleUrls: ["./cumulocity-video-widget.component.css"],
})
export class CumulocityVideoWidget implements OnInit, AfterViewInit, OnDestroy {

    @Input() config;

    @ViewChild('videoPlayer', {'static':false}) videoElementRef!: ElementRef;

    videoElement!: HTMLVideoElement;

    public selectedSource;
    public selectedSourceIndex;
    public sourcesLength;

    public initializationFailed: boolean = false;

    public topMargin = '';

    private subscription: object = null;

    constructor(private _sanitizer: DomSanitizer, private changeDetetector: ChangeDetectorRef, private realtimeService: Realtime) {
    }

    ngOnInit(): void {
        try {
            this.sourcesLength = this.config.customWidgetData.sources.length;
            this.config.customWidgetData.sources.forEach((source) => {
                if(source.url === undefined || source.url === "") {
                    throw new Error("Source url is blank.");
                } else {
                    if(source.type === "embed") {
                        if(this.config.customWidgetData.player.autoplay === 1 || this.config.customWidgetData.player.autoplay === true) {
                            if(source.url.indexOf("?") > -1) {
                                source.sanitizedUrl = source.url + "&autoplay=1&muted=1&mute=1";
                            } else {
                                source.sanitizedUrl = source.url + "?autoplay=1&muted=1&mute=1";
                            }
                            source.sanitizedUrl = this._sanitizer.bypassSecurityTrustResourceUrl(source.sanitizedUrl);
                        } else {
                            source.sanitizedUrl = this._sanitizer.bypassSecurityTrustResourceUrl(source.url);
                        }
                    }
                }
                if(source.title === undefined || source.title === "") {
                    throw new Error("Title is blank.");
                }
            });
            this.selectedSource = this.config.customWidgetData.sources[0];
            this.selectedSourceIndex = 0;
        } catch(err) {
            this.initializationFailed = true;
            console.log("Video widget - "+err);
        }
    }

    async ngAfterViewInit(): Promise<void> {
        try {
            this.configureTopMarginRequired();
            if(!this.initializationFailed) {
                this.config.customWidgetData.sources.forEach((source, index) => {
                    if(source.selected === true) {
                        this.selectedSource = source;
                        this.selectedSourceIndex = index;
                        if(this.selectedSource.type === "stream") {
                            if(this.videoElementRef === undefined) {
                                throw new Error("Video element not found.");
                            } else {
                                this.showStreamingVideoPlayer();
                            }
                        } else if(this.selectedSource.type === "ondemand") {
                            if(this.videoElementRef === undefined) {
                                throw new Error("Video element not found.");
                            } else {
                                this.showOnDemandVideoPlayer();
                            }
                        }
                    }
                });
            }
        } catch(err) {
            console.log("Video widget - "+err);
        }
        return;
    }

    private showStreamingVideoPlayer(): void {
        this.videoElement = this.videoElementRef.nativeElement;
        this.videoElement.muted = true;
        if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(this.selectedSource.url);
            hls.attachMedia(this.videoElement);
            if(this.config.customWidgetData.player.autoplay === 1 || this.config.customWidgetData.player.autoplay === true) {
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.videoElement.play();
                });
            }
        } else {
            throw new Error("HLS library not supported.");
        }
    }

    private showOnDemandVideoPlayer(): void {
        this.videoElement = this.videoElementRef.nativeElement;
        this.videoElement.src = this.selectedSource.url;
        this.videoElement.muted = true;
        if(this.config.customWidgetData.player.loop === 1 || this.config.customWidgetData.player.loop === true) {
            this.videoElement.loop = true;
        }
        if(this.config.customWidgetData.player.autoplay === 1 || this.config.customWidgetData.player.autoplay === true) {
            this.videoElement.play();
        }
        if(this.config.device !== undefined && this.config.device !== null && this.config.device.id !== undefined && this.config.device.id !== null && this.config.device.id !== "") {
            if(this.config.customWidgetData.measurement !== undefined && this.config.customWidgetData.measurement !== null && this.config.customWidgetData.measurement !== "") {
                let fragmentSeries = this.config.customWidgetData.measurement.split(".");
                let fragment = fragmentSeries[0];
                let series = fragmentSeries[1];
                this.subscription = this.realtimeService.subscribe('/measurements/'+this.config.device.id, (data) => {
                    try {
                        if(data.data.data[fragment] && data.data.data[fragment][series]) {
                            this.videoElement.currentTime = data.data.data[fragment][series].value;
                            // Start playing the video if its not playing already from the specific timestamp
                            if(this.videoElement.paused) {
                                this.videoElement.play();
                            }
                        } 
                    } catch(e) {
                        console.log("Video widget - "+e);
                    }
                });
            }
        }
    }

    public changeSource(newSource): void {
        this.config.customWidgetData.sources.forEach((source, index) => {
            if(source.title === newSource.title && source.url === newSource.url && source.type === newSource.type) {
                this.selectedSource = newSource;
                this.selectedSourceIndex = index;
                this.changeDetetector.detectChanges();
                if(this.selectedSource.type === "stream") {
                    if(this.videoElementRef === undefined) {
                        throw new Error("Video element not found.");
                    } else {
                        this.showStreamingVideoPlayer();
                    }
                } else if(this.selectedSource.type === "ondemand") {
                    if(this.videoElementRef === undefined) {
                        throw new Error("Video element not found.");
                    } else {
                        this.showOnDemandVideoPlayer();
                    }
                }
            }
        });
    }

    public playPrevious(): void {
        try {
            if(this.selectedSourceIndex > 0) {
                this.changeSource(this.config.customWidgetData.sources[this.selectedSourceIndex - 1]);
            }
        } catch(e) {
            console.log("Video widget - "+e);
        }
    }

    public playNext(): void {
        try {
            if(this.selectedSourceIndex < this.sourcesLength - 1) {
                this.changeSource(this.config.customWidgetData.sources[this.selectedSourceIndex + 1]);
            }
        } catch(e) {
            console.log("Video widget - "+e);
        }
    }

    // Configure top margin within the widget. This is on the basis if the Widget title is set to hidden or not.
    private configureTopMarginRequired(): void {
        let allWidgets: NodeListOf<Element> = document.querySelectorAll('.dashboard-grid-child');
        allWidgets.forEach((w:Element) => {
            let widgetElement: Element = w.querySelector('div > div > div > c8y-dynamic-component > lib-cumulocity-video-widget');
            if(widgetElement !== undefined && widgetElement !== null) {
                let widgetTitleElement: Element = w.querySelector('div > div > div > c8y-dashboard-child-title');
                const widgetTitleDisplayValue: string = window.getComputedStyle(widgetTitleElement).getPropertyValue('display');
                if(widgetTitleDisplayValue !== undefined && widgetTitleDisplayValue !== null && widgetTitleDisplayValue === 'none') {
                    this.topMargin = '10px';
                } else {
                    this.topMargin = '0';
                }
            }
        });
    }

    ngOnDestroy(): void {
        if(this.subscription !== undefined && this.subscription !== null) {
            this.realtimeService.unsubscribe(this.subscription);
        }
    }

}
