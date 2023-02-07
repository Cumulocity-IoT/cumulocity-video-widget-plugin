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

import { CoreModule, HOOK_COMPONENTS } from "@c8y/ngx-components";
import { CumulocityVideoWidgetConfig } from "./cumulocity-video-widget.config.component";
import { CumulocityVideoWidget } from "./cumulocity-video-widget.component";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";

@NgModule({
    imports: [CoreModule, HttpClientModule],
    declarations: [CumulocityVideoWidget, CumulocityVideoWidgetConfig],
    entryComponents: [CumulocityVideoWidget, CumulocityVideoWidgetConfig],
    providers: [
        {
            provide: HOOK_COMPONENTS,
            multi: true,
            useValue: {
                id: "global.presales.cumulocity.video.widget",
                label: "Video",
                description: "Plays streaming videos from sources such as HLS streams, on-demand videos (such as MP4, MKV, MOV) from URL and embedded YouTube, Vimeo, etc. videos. Please note that links must be HTTPS and Cross-Origin access enabled.",
                component: CumulocityVideoWidget,
                configComponent: CumulocityVideoWidgetConfig,
                previewImage: require("../widget/assets/img-preview.png"),
                data: {
                    ng1: {
                        options: {
                        noDeviceTarget: false,
                        noNewWidgets: false,
                        deviceTargetNotRequired: false,
                        groupsSelectable: true
                        }
                    }
                },
            },
        },
    ],
})
export class CumulocityVideoWidgetModule { }
