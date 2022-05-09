import React from 'react';
import {observer, inject} from 'mobx-react';
import {IMainStore} from '../store';
import {Button, AsideNav, Layout, confirm, alert} from 'amis';
import {RouteComponentProps, matchPath, Switch, Route} from 'react-router';
import {Link} from 'react-router-dom';
import NotFound from './NotFound';
import AMISRenderer from '../component/AMISRenderer';
import AddPageModal from '../component/AddPageModal';
import EditPageModal from '../component/EditPageModal';
import axios from 'axios';

function isActive(link: any, location: any) {
    const ret = matchPath(location.pathname, {
        path: link ? link.replace(/\?.*$/, '') : '',
        exact: true,
        strict: true
    });

    return !!ret;
}

export default inject('store')(
    observer(function ({store, location, history}: {store: IMainStore} & RouteComponentProps) {
        function renderHeader() {
            return (
                <div>
                    <div className={`a-Layout-headerBar`}>
                        <div className="hidden-xs p-t-sm pull-right">
                            {/* <Button size="sm" className="m-r-xs" level="success" disabled disabledTip="Todo...">
                                全部导出
                            </Button> */}
                            <Button size="sm" level="info" onClick={() => store.setAddPageIsOpen(true)}>
                                新增页面
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        function renderAside() {
            const navigations = store.pages.map(item => ({
                label: item.label,
                path: item.path,
                icon: item.icon,
                pageId: item.id
            }));
            const ids = navigations.map(item => item.pageId);

            return (
                <AsideNav
                    key={store.asideFolded ? 'folded-aside' : 'aside'}
                    navigations={[
                        {
                            label: '导航',
                            children: navigations
                        }
                    ]}
                    renderLink={({link, toggleExpand, classnames: cx, depth}: any) => {
                        if (link.hidden) {
                            return null;
                        }

                        let children = [];

                        if (link.children) {
                            children.push(
                                <span
                                    key="expand-toggle"
                                    className={cx('AsideNav-itemArrow')}
                                    onClick={e => toggleExpand(link, e)}
                                ></span>
                            );
                        }

                        link.badge &&
                            children.push(
                                <b key="badge" className={cx(`AsideNav-itemBadge`, link.badgeClassName || 'bg-info')}>
                                    {link.badge}
                                </b>
                            );

                        if (link.icon) {
                            children.push(<i key="icon" className={cx(`AsideNav-itemIcon`, link.icon)} />);
                        } else if (store.asideFolded && depth === 1) {
                            children.push(
                                <i
                                    key="icon"
                                    className={cx(`AsideNav-itemIcon`, link.children ? 'fa fa-folder' : 'fa fa-info')}
                                />
                            );
                        }

                        link.active ||
                            children.push(
                                <i
                                    key="delete"
                                    data-tooltip="删除"
                                    data-position="bottom"
                                    className={'navbtn fa fa-times'}
                                    onClick={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        confirm('确认要删除').then(confirmed => {
                                            if(confirmed) {
                                                axios.post('/api/page/delete', { id: link.pageId * 1 }).then(({ data }) => {
                                                    if(data.errno !== 0) {
                                                        alert(data.msg, '删除页面失败')
                                                        return
                                                    }
                                    
                                                    store.removePageAt(ids.indexOf(link.pageId));
                                                }).catch(err => {
                                                    alert(err.message, "网络异常")
                                                })
                                            }
                                        });
                                    }}
                                />
                            );

                        children.push(
                            <i
                                key="edit"
                                data-tooltip="编辑"
                                data-position="bottom"
                                className={'navbtn fa fa-gear'}
                                onClick={() => store.setEditPage({
                                    label: link.label,
                                    icon: link.icon,
                                    id: link.pageId,
                                    path: link.path,
                                })}
                            />,
                            <i
                                key="design"
                                data-tooltip="设计页面"
                                data-position="bottom"
                                className={'navbtn fa fa-pencil'}
                                onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    history.push(`/edit/${link.pageId}`);
                                }}
                            />
                        );

                        children.push(
                            <span key="label" className={cx('AsideNav-itemLabel')}>
                                {link.label}
                            </span>
                        );

                        return link.path ? (
                            link.active ? (
                                <a>{children}</a>
                            ) : (
                                <Link to={link.path[0] === '/' ? link.path : `${link.path}`}>{children}</Link>
                            )
                        ) : (
                            <a
                                onClick={
                                    link.onClick ? link.onClick : link.children ? () => toggleExpand(link) : undefined
                                }
                            >
                                {children}
                            </a>
                        );
                    }}
                    isActive={(link: any) =>
                        isActive(link.path && link.path[0] === '/' ? link.path : `${link.path}`, location)
                    }
                />
            );
        }

        function handleConfirm(value: {label: string; icon: string; path: string; adminPath: string}) {
            const params = {
                name: value.label,
                path: value.path,
                icon: value.icon,
                config: JSON.stringify({
                    type: 'page',
                    title: value.label,
                    body: '这是你刚刚新增的页面。'
                }),
            }

            axios.post('/api/page/create', params).then(({ data }) => {
                if(data.errno !== 0) {
                    alert(data.msg, '新增页面失败')
                    return
                }

                store.addPage({
                    ...value,
                    id: `${data.data}`,
                    schema: JSON.parse(params.config)
                });
                store.setAddPageIsOpen(false);
            }).catch(err => {
                alert(err.message, "网络异常")
            })
        }

        function handleConfirmEdit(params: any) {
            axios.post('/api/page/update', {
                id: params.id,
                name: params.label,
                icon: params.icon,
                path: params.path
            }).then(({ data }) => {
                if(data.errno !== 0) {
                    alert(data.msg, '修改配置失败')
                    return
                }
                store.setEditPage(null);
                store.updatePageSchemaData(params.id, params)
            }).catch(err => {
                alert(err.message, "网络异常")
            })
        }
        return (
            <Layout
                aside={renderAside()}
                header={renderHeader()}
                folded={store.asideFolded}
                offScreen={store.offScreen}
            >
                <Switch>
                    {store.pages.map(item => (
                        <Route
                            key={item.id}
                            path={item.path}
                            render={() => <AMISRenderer schema={item.schema} />}
                        />
                    ))}
                    <Route component={NotFound} />
                </Switch>
                <AddPageModal
                    show={store.addPageIsOpen}
                    onClose={() => store.setAddPageIsOpen(false)}
                    onConfirm={handleConfirm}
                    pages={store.pages.concat()}
                />
                <EditPageModal
                    show={!!store.editPage}
                    onClose={() => store.setEditPage(null)}
                    onConfirm={handleConfirmEdit}
                    page={store.editPage}
                />
            </Layout>
        );
    })
);
