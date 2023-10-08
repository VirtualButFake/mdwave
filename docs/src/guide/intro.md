# MDWave

MDWave is a Moonwave frontend in VitePress. The goal for this project was to preserve the simplicity of Moonwave, while adding the flare of VitePress.

Most Moonwave knowledge will transfer over, considering that this uses the exact same extractor as Moonwave, so same tags, same types, just not same frontend.

However, commands, configuration and some other things will be different.

## Installing MDWave

MDWave is designed to fit into your existing Moonwave installation, with a few documentation changes.

1. Install Node.js (version 18+)
2. Open a terminal
3. Run ``npm install -g mdwave``
::: info
MDWave does not pull from a default directory like Moonwave does, so you will need to specify the directory when building or starting a dev server.
The project path is the current working directory, so things like configuration will be pulled from there.
:::

## Using MDWave

MDWave is extremely simple to use, with only 2 commands that you'll be using most of the time.

### Building

1. Open a terminal
2. Navigate to your project directory (where your ``mdwave.toml`` file is)
3. Run ``mdwave build <project path> <mode> [options]``

::: tip 
If you want to publish to GitHub Pages, make sure to provide ``-o github-pages`` as an option. 
It will try to find a repository in the current directory and push to the GitHub pages branch.
:::

### Starting a dev server

1. Open a terminal
2. Navigate to your project directory (where your ``mdwave.toml`` file is)
3. Run ``mdwave dev <project path>``

::: info
The currently supported modes are ``markdown`` and ``vitepress``. 
Recommended mode is Vitepress, Markdown exists more as a proof of concept.
:::