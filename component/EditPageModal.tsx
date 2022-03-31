import {schema2component} from './AMISRenderer';

export default schema2component(
    {
        type: 'dialog',
        title: '编辑页面基本信息',
        body: {
            type: 'form',
            controls: [
                {
                    type: 'text',
                    label: '名称',
                    name: 'label',
                    validations: {
                        maxLength: 20
                    },
                    required: true
                },

                {
                    type: 'text',
                    label: '路径',
                    name: 'path',
                    placeholder: '/ 开头，字母、数字中下划线组合，末尾不需要 /',
                    validations: {
                        matchRegexp: /^(\/[a-zA-Z0-9_-]+)+$/
                    },
                    required: true,
                },
                {
                    type: 'icon-picker',
                    label: '图标',
                    name: 'icon'
                }
            ]
        }
    },
    ({onConfirm, page, pages, ...rest}: any) => {
        return {
            ...rest,
            data: {
                ...page,
            },
            onConfirm: (values: Array<any>) => onConfirm && onConfirm({
                ...values[0],
                id: page.id * 1
            })
        };
    }
);
