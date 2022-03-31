import {types, getEnv, applySnapshot, getSnapshot} from 'mobx-state-tree';
import {PageStore} from './Page';
import {when, reaction} from 'mobx';
import axios from 'axios';
import { alert } from 'amis';
let pagIndex = 1;
export const MainStore = types
    .model('MainStore', {
        pages: types.optional(types.array(PageStore), [
            {
                id: `${pagIndex}`,
                path: '/hello-world',
                label: 'Hello world',
                icon: 'fa fa-file',
                schema: {
                    type: 'page',
                    title: 'Hello world',
                    body: '初始页面'
                }
            }
        ]),
        theme: 'cxd',
        asideFixed: true,
        asideFolded: false,
        offScreen: false,
        addPageIsOpen: false,
        preview: false,
        isMobile: false,
        schema: types.frozen()
    })
    .views(self => ({
        get fetcher() {
            return getEnv(self).fetcher;
        },
        get notify() {
            return getEnv(self).notify;
        },
        get alert() {
            return getEnv(self).alert;
        },
        get copy() {
            return getEnv(self).copy;
        }
    }))
    .actions(self => {
        function toggleAsideFolded() {
            self.asideFolded = !self.asideFolded;
        }

        function toggleAsideFixed() {
            self.asideFixed = !self.asideFixed;
        }

        function toggleOffScreen() {
            self.offScreen = !self.offScreen;
        }

        function setAddPageIsOpen(isOpened: boolean) {
            self.addPageIsOpen = isOpened;
        }

        // 新增页面
        function addPage(data: {label: string; path: string; icon?: string; schema?: any; id: string}) {
            self.pages.push(
                PageStore.create(data)
            );
        }

        function removePageAt(index: number) {
            self.pages.splice(index, 1);
        }

        // 保存页面配置
        function updatePageSchemaAt(id: string) {
            const index =  self.pages.findIndex(v => v.id == id);
            self.pages[index].updateSchema(self.schema);
        }

        function updateSchema(value: any) {
            self.schema = value;
        }

        function setPreview(value: boolean) {
            self.preview = value;
        }

        function setIsMobile(value: boolean) {
            self.isMobile = value;
        }

        // 初始化页面列表
        function initPages(value: any) {
            self.pages = [...self.pages, ...value]
        }

        return {
            toggleAsideFolded,
            toggleAsideFixed,
            toggleOffScreen,
            setAddPageIsOpen,
            addPage,
            removePageAt,
            updatePageSchemaAt,
            updateSchema,
            setPreview,
            setIsMobile,
            initPages,
            afterCreate() {
                // 初始化 store 执行一次
                axios.get('/api/config/pages').then(({ data }) => {
                    if(data.errno !== 0) {
                        alert(data.msg, '获取页面数据失败')
                        return
                    }

                    const pages = data.data.items.map(v => ({
                        id: `${v.id}`,
                        label: v.name,
                        path: v.path,
                        icon: v.icon,
                        schema: v.config ? JSON.parse(v.config) : { type: 'page' }
                    }))

                    self.initPages(pages)                    
                }).catch((err) => {
                    alert(err.message, '网络异常')
                })

                // persist store
                // if (typeof window !== 'undefined' && window.localStorage) {
                //     const storeData = window.localStorage.getItem('store');
                //     if (storeData) applySnapshot(self, JSON.parse(storeData));

                //     reaction(
                //         () => getSnapshot(self),
                //         json => {
                //             window.localStorage.setItem('store', JSON.stringify(json));
                //         }
                //     );
                // }
            }
        };
    });

export type IMainStore = typeof MainStore.Type;
