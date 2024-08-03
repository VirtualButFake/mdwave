<script setup>
import TypeAlias from './TypeAlias.vue';
import { useData } from 'vitepress';
const { frontmatter } = useData();
import RenderTokenMap from '../Lua/RenderTokenMap.vue';

import tokenUtil from '../../utils/tokenUtil';
const createTokens = tokenUtil.createTokens;
const mergeTokenMaps = tokenUtil.mergeTokens;

const props = defineProps({
    typeContext: {
        type: Object,
        required: true,
    },
    func: {
        type: Object,
        required: true,
    },
});

// generate token maps
// we need maps for:
// - return types
// - parameters
// generate main source block
var tokenMap;
if (props.func.name != '__iter') {
    let startTokens = [
        {
            tokens: [
                {
                    type: 'code',
                    text: frontmatter.value.class.name,
                    color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
                },
                {
                    type: 'code',
                    text: props.func.function_type === 'static' ? '.' : ':',
                    color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
                },
                {
                    type: 'code',
                    text: props.func.name,
                    color: 'text-syntax-identifier-light dark:text-syntax-identifier-dark',
                },
                {
                    type: 'code',
                    text: '(',
                    depth: 1,
                },
            ],
            depth: 0,
        },
    ];

    // generate parameter tokens
    let paramMap = [];

    for (let param of props.func.params) {
        let paramString = `${param.name}: ${param.lua_type}${param == props.func.params[props.func.params.length - 1] ? '' : ','}`;
        const tokens = createTokens(props.typeContext, paramString, 1);

        // find the last token
        let lastLine = tokens[tokens.length - 1];

        if (param.desc) {
            lastLine.tokens.push({
                type: 'description',
                text: ` ${param.desc}`,
                color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
            });
        }

        paramMap = mergeTokenMaps(paramMap, tokens);
    }

    // get reutnr type
    let returnMap = [];

    if (props.func.returns.length > 1) {
        returnMap = [
            {
                tokens: [
                    {
                        type: 'code',
                        text: '(',
                        depth: 1,
                    },
                ],
                depth: 0,
            },
        ];
    }

    for (let retVal of props.func.returns) {
        let returnString = `${retVal.lua_type}${
            retVal == props.func.returns[props.func.returns.length - 1]
                ? ''
                : ','
        }`;
        const tokens = createTokens(props.typeContext, returnString, 0);

        // find the last token
        let lastLine = tokens[tokens.length - 1];

        if (retVal.desc) {
            lastLine.tokens.push({
                type: 'description',
                text: `${retVal.desc}`,
                color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
            });
        }

        returnMap = mergeTokenMaps(returnMap, tokens);
    }

    // clsoe off returnmap opening
    if (props.func.returns.length > 1) {
        returnMap = mergeTokenMaps(returnMap, [
            {
                tokens: [
                    {
                        type: 'code',
                        text: ')',
                        depth: 1,
                    },
                ],
                depth: 0,
            },
        ]);
    }

    const closingBrackets = [
        {
            tokens: [
                {
                    type: 'code',
                    text: ')',
                    depth: 1,
                },
            ],
            depth: 0,
        },
    ];

    if (props.func.returns.length != 0) {
        closingBrackets[0].tokens.push({
            type: 'code',
            text: ' → ',
            color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
        });
    }

    tokenMap = mergeTokenMaps(
        mergeTokenMaps(
            mergeTokenMaps(startTokens, paramMap),
            closingBrackets,
            props.func.params.length == 0 ? true : false
        ),
        returnMap,
        true
    );
} else {
    // iter
    let returnMap = [];

    if (props.func.returns.length > 1) {
        returnMap = [
            {
                tokens: [
                    {
                        type: 'code',
                        text: '(',
                        depth: 1,
                    },
                ],
                depth: 0,
            },
        ];
    }

    for (let retVal of props.func.returns) {
        let returnString = `${retVal.lua_type}${
            retVal == props.func.returns[props.func.returns.length - 1]
                ? ''
                : ','
        }`;
        const tokens = createTokens(props.typeContext, returnString, 1);

        // find the last token
        let lastLine = tokens[tokens.length - 1];

        if (retVal.desc) {
            lastLine.tokens.push({
                type: 'description',
                text: `${retVal.desc}`,
                color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
            });
        }

        returnMap = mergeTokenMaps(returnMap, tokens);
    }

    // clsoe off returnmap opening
    if (props.func.returns.length > 1) {
        returnMap = mergeTokenMaps(returnMap, [
            {
                tokens: [
                    {
                        type: 'code',
                        text: ')',
                        depth: 1,
                    },
                ],
                depth: 0,
            },
        ]);
    }

    let startTokens = [
        {
            tokens: [
                {
                    type: 'code',
                    text: 'for ',
                    color: 'text-syntax-identifier-light dark:text-syntax-identifier-dark',
                },
            ],
            depth: 0,
        },
    ];

    tokenMap = mergeTokenMaps(startTokens, returnMap, true);

    let endTokens = [
        {
            tokens: [
                {
                    type: 'code',
                    text: ' in ',
                    color: 'text-syntax-identifier-light dark:text-syntax-identifier-dark',
                },
                {
                    type: 'code',
                    text: frontmatter.value.class.name,
                },
                {
                    type: 'code',
                    text: ' do',
                    color: 'text-syntax-identifier-light dark:text-syntax-identifier-dark',
                },
            ],
            depth: 0,
        },
    ];

    tokenMap = mergeTokenMaps(tokenMap, endTokens, true);
}

// extra types
const extraTypes =
    frontmatter.value.extraTypes[
        frontmatter.value.class.functions.indexOf(props.func)
    ];
</script>
<template>
    <RenderTokenMap :tokenMap="tokenMap" />
    <div v-if="extraTypes">
        <h4>Types</h4>
        <TypeAlias
            :id="extraType.name"
            v-for="extraType in extraTypes"
            :typeContext="props.typeContext"
            :type="extraType"
        />
    </div>
</template>
