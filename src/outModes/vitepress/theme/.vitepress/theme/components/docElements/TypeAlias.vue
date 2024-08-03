<script setup>
import tokenUtil from '../../utils/tokenUtil';
import RenderTokenMap from '../Lua/RenderTokenMap.vue';
const createTokens = tokenUtil.createTokens;
const mergeTokenMaps = tokenUtil.mergeTokens;

const props = defineProps({
    typeContext: {
        type: Object,
        required: true,
    },
    type: {
        type: Object,
        required: true,
    },
});

// first we figure out whether this is a interfasce or type alias
var tokenMap;
if (props.type.lua_type) {
    // prepare start data
    let startTokens = [
        {
            tokens: [
                {
                    type: 'code',
                    text: 'type ',
                    color: 'text-red-600 dark:text-indigo-400',
                },
                {
                    type: 'code',
                    text: props.type.name,
                    color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
                },
                {
                    type: 'code',
                    text: ' = ',
                    color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
                },
            ],
            depth: 0,
        },
    ];

    // parse type
    let typeTokens = createTokens(props.typeContext, props.type.lua_type);
    tokenMap = mergeTokenMaps(startTokens, typeTokens, true);
} else {
    // interface
    // prepare start data
    let startTokens = [
        {
            tokens: [
                {
                    type: 'code',
                    text: 'interface ',
                    color: 'text-red-600 dark:text-indigo-400',
                },
                {
                    type: 'code',
                    text: props.type.name,
                    color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
                },
                {
                    type: 'code',
                    text: ' { ',
                    color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
                },
            ],
            depth: 0,
        },
    ];

    // parse params
    let paramMap = [];
    for (let param of props.type.fields) {
        let paramString = `${param.name}: ${param.lua_type},`;
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

    let endTokens = [
        {
            tokens: [
                {
                    type: 'code',
                    text: '}',
                    color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
                },
            ],
            depth: 0,
        },
    ];

    tokenMap = mergeTokenMaps(mergeTokenMaps(startTokens, paramMap), endTokens);
}
</script>
<template>
    <RenderTokenMap :token-map="tokenMap" />
</template>
