import React from 'react';
import {Editor} from 'amis-editor';
import {inject, observer} from 'mobx-react';
import {IMainStore} from '../store';
import {RouteComponentProps} from 'react-router-dom';
import {Layout, Switch, classnames as cx, toast, alert} from 'amis';
import '../renderer/MyRenderer';
import '../editor/MyRenderer';
import axios from 'axios';

let currentId = -1;

let host = `${window.location.protocol}//${window.location.host}`;
let iframeUrl = '/editor.html';

// 如果在 gh-pages 里面
if (/^\/amis-editor-demo/.test(window.location.pathname)) {
    host += '/amis-editor';
    iframeUrl = '/amis-editor-demo' + iframeUrl;
}

const schemaUrl = `${host}/schema.json`;

// @ts-ignore
__uri('amis/schema.json');

export default inject('store')(
    observer(function ({store, location, history, match}: {store: IMainStore} & RouteComponentProps<{id: string}>) {
        const id: number = parseInt(match.params.id, 10);
        
        const page: any = store.pages.find(v => v.id == match.params.id)
        if (id !== currentId && page) {
            currentId = id;
            store.updateSchema(page.schema);
        }

        function save() {
            const findPage: any = store.pages.find(v => v.id == match.params.id)
            store.updatePageSchemaAt(findPage.id);

            axios.post('/api/page/update', { 
                id: findPage.id * 1,
                config: JSON.stringify(findPage.schema),
            }).then(({ data }) => {
                if(data.errno !== 0) {
                    alert(data.msg, '保存页面失败')
                    return
                }

                toast.success('保存成功', '提示');
            }).catch(err => {
                alert(err.message, "网络异常")
            })


        }

        function exit() {
            history.push(page.path);
        }

        function renderHeader() {
            return (
                <div className="editor-header clearfix box-shadow bg-dark">
                    <div className="editor-preview">
                        预览{' '}
                        <Switch
                            value={store.preview}
                            onChange={(value: boolean) => store.setPreview(value)}
                            className="m-l-xs"
                            inline
                        />
                    </div>

                    <div className="editor-preview">
                        移动端{' '}
                        <Switch
                            value={store.isMobile}
                            onChange={(value: boolean) => store.setIsMobile(value)}
                            className="m-l-xs"
                            inline
                        />
                    </div>

                    <div className="editor-header-btns">
                        <div className={cx('btn-item')} onClick={save}>
                            保存
                        </div>

                        <div className="btn-item" onClick={exit}>
                            退出
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <Layout header={renderHeader()} headerFixed={false}>
                <Editor
                    theme={'cxd'}
                    preview={store.preview}
                    value={store.schema}
                    onChange={(value: any) => store.updateSchema(value)}
                    className="is-fixed"
                    $schemaUrl={schemaUrl}
                    iframeUrl={iframeUrl}
                    isMobile={store.isMobile}
                />
            </Layout>
        );
    })
);
