<template>
    <div class="language-lua vp-adaptive-theme">
        <button class="copy" title="Copy Code" />
        <span class="lang">lua</span>
        <pre class="shiki github-dark vp-code-dark"><slot /></pre>
        <pre class="shiki github-dark vp-code-light"><slot /></pre>
    </div>
</template>