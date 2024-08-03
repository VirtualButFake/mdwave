<script setup>
import { useData } from 'vitepress';
const { frontmatter } = useData();
import tokenUtil from '../../utils/tokenUtil';
import RenderTokenMap from '../Lua/RenderTokenMap.vue';
const createTokens = tokenUtil.createTokens;
const mergeTokenMaps = tokenUtil.mergeTokens;

const props = defineProps({
    typeContext: {
        type: Object,
        required: true,
    },
    prop: {
        type: Object,
        required: true,
    },
});

const typeTokens = createTokens(props.typeContext, props.prop.lua_type);
const startTokens = [
    {
        tokens: [
            {
                type: 'code',
                text: frontmatter.value.class.name,
                color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
            },
            {
                type: 'code',
                text: '.',
                color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
            },
            {
                type: 'code',
                text: props.prop.name,
                color: 'text-syntax-identifier-light dark:text-syntax-identifier-dark',
            },
            {
                type: 'code',
                text: ': ',
                color: 'text-syntax-punc-light dark:text-syntax-punc-dark',
            },
        ],
        depth: 0,
    },
];

const tokenMap = mergeTokenMaps(startTokens, typeTokens, true);
</script>
<template>
    <RenderTokenMap :tokenMap="tokenMap" />
</template>
