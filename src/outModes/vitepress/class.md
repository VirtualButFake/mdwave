---
$FRONT_MATTER$
---

<script setup>

import { useData } from "vitepress";
const { frontmatter } = useData();

import ItemData from '../../.vitepress/theme/components/docElements/ItemData.vue'
import TypeAlias from "../../.vitepress/theme/components/docElements/TypeAlias.vue";
import Prop from "../../.vitepress/theme/components/docElements/Property.vue";
import LuaFunction from "../../.vitepress/theme/components/docElements/Function.vue";
</script>

# Markdown(["name"]) <ItemData :member="$frontmatter.class"/>

Markdown(["desc"])
$SECTION_LIST$
