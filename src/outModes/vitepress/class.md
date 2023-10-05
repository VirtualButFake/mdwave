---
$FRONT_MATTER$
---

<script setup>

import { useData } from "vitepress";
const { frontmatter } = useData();

import ItemData from '../.vitepress/theme/components/docElements/ItemData.vue'
import LuaTypeDef from "../.vitepress/theme/components/docElements/TypeDef.vue";
import LuaProp from "../.vitepress/theme/components/docElements/Property.vue";
import LuaFunction from "../.vitepress/theme/components/docElements/Function.vue";
</script>

# Markdown(["name"]) <ItemData :member="$frontmatter.class"/>
Markdown(["desc"])
$SECTION_LIST$
