/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import DistributedData from '@ohos.data.distributeddata';
import LogUtil from '../common/utils/LogUtil.js';
import DateTimeUtil from '../common/utils/DateTimeUtil.js';

let mLogUtil = new LogUtil();
let mDateTimeUtil = new DateTimeUtil();
const STORE_ID = 'camera_kv_store';

export default class KvStoreModel {
    kvManager;
    kvStore;

    constructor() {
    }

    createKvStore(callback) {
        if (typeof (this.kvStore) === 'undefined') {
            var config = {
                bundleName: 'com.ohos.camera',
                userInfo: {
                    userId: '0',
                    userType: 0
                }
            };
            let self = this;
            mLogUtil.cameraInfo('Camera[KvStoreModel] createKVManager begin');
            DistributedData.createKVManager(config).then((manager) => {
                mLogUtil.cameraInfo(`Camera[KvStoreModel] createKVManager success, kvManager
                ${JSON.stringify(manager)}`);
                self.kvManager = manager;
                var options = {
                    createIfMissing: true,
                    encrypt: false,
                    backup: false,
                    autoSync: true,
                    kvStoreType: 1,
                    schema: '',
                    securityLevel: 3,
                };
                mLogUtil.cameraInfo('Camera[KvStoreModel] kvManager.getKVStore begin');
                self.kvManager.getKVStore(STORE_ID, options).then((store) => {
                    mLogUtil.cameraInfo(`Camera[KvStoreModel] getKVStore success, kvStore=${store}`);
                    self.kvStore = store;
                    callback();
                });
                mLogUtil.cameraInfo('Camera[KvStoreModel] kvManager.getKVStore end');
            });
            mLogUtil.cameraInfo('Camera[KvStoreModel] createKVManager end');
        } else {
            callback();
        }
    }

    broadcastMessage(msg) {
        mLogUtil.cameraInfo('broadcastMessage begin.');
        mLogUtil.cameraInfo(` Camera[KvStoreModel] broadcastMessage${msg}`);
        let self = this;
        var num = self.getBroadcastId();
        this.createKvStore(() => {
            self.put(msg, num);
        });
        mLogUtil.cameraInfo('broadcastMessage end.');
    }

    put(key, value) {
        mLogUtil.cameraInfo(`Camera[KvStoreModel] kvStore.put key ${key},value ${value}`);
        this.kvStore.put(key, value).then((data) => {
            this.kvStore.get(key).then((data) => {
                mLogUtil.cameraInfo(`Camera[KvStoreModel] kvStore.get key ${key}, data ${JSON.stringify(data)}`);
            });
            mLogUtil.cameraInfo(`Camera[KvStoreModel] kvStore.put key ${key}, finished, data ${JSON.stringify(data)}`);
        }).catch((err) => {
            mLogUtil.cameraError(`Camera[KvStoreModel] kvStore.put key ${key}, failed ${JSON.stringify(err)}`);
        });
    }

    setOnMessageReceivedListener(msg, callback) {
        mLogUtil.cameraInfo('setOnMessageReceivedListener begin.');
        mLogUtil.cameraInfo(`Camera[KvStoreModel] setOnMessageReceivedListener ${msg}`);
        let self = this;
        this.createKvStore(() => {
            mLogUtil.cameraInfo('Camera[KvStoreModel] kvStore.on(dataChange) begin');
            self.kvStore.on('dataChange', 1, (data) => {
                mLogUtil.cameraInfo(`Camera[KvStoreModel] dataChange, ${JSON.stringify(data)}`);
                mLogUtil.cameraInfo(`Camera[KvStoreModel] dataChange, insert
                ${data.insertEntries.length} udpate ${data.updateEntries.length}`);
                for (let item of data.insertEntries) {
                    if (item.key === msg) {
                        mLogUtil.cameraInfo(`Camera insertEntries receive ${msg} = ${item.value}`);
                        callback();
                        return;
                    }
                }
                for (let prop of data.updateEntries) {
                    if (prop.key === msg) {
                        mLogUtil.cameraInfo(`Camera updateEntries receive ${msg} = ${prop.value}`);
                        callback();
                        return;
                    }
                }
            });
            mLogUtil.cameraInfo('Camera[KvStoreModel] kvStore.on(dataChange) end');
        });
        mLogUtil.cameraInfo('setOnMessageReceivedListener end.');
    }

    setOffMessageReceivedListener() {
        mLogUtil.cameraInfo('setOffMessageReceivedListener begin.');
        mLogUtil.cameraInfo('setOffMessageReceivedListener end.');
    }

    messageData() {
        mLogUtil.cameraInfo('messageData begin.');
        var data = {
            msgFromDistributedTakePhoto: 'msgFromDistributedTakePhoto',
            msgFromDistributedBack: 'msgFromDistributedBack',
            msgFromDistributedQuit: 'msgFromDistributedQuit',
            msgFromResponderReady: 'msgFromResponderReady',
            msgFromResponderBack: 'msgFromResponderBack',
            msgFromResponderQuit: 'msgFromResponderQuit'
        };
        mLogUtil.cameraInfo(`messageData data: ${data}`);
        return data;
    }

    getBroadcastId() {
        mLogUtil.cameraInfo('getBroadcastId begin.');
        let broadcastRandom = Math.random();
        let broadcastTime = mDateTimeUtil.getTime();
        let splitBroadcastTime = broadcastTime.split(':').join('');
        let broadcastDay = mDateTimeUtil.getDate();
        let splitBroadcastDay = broadcastDay.split('-').join('');
        let concatBroadcastId = `${splitBroadcastDay}` + `${splitBroadcastTime}` + `${broadcastRandom}`;
        mLogUtil.cameraInfo('getBroadcastId end.');
        return concatBroadcastId;
    }
}