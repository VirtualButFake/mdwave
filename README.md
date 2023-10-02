# moonwave_converter
A simple converter for [Moonwave](https://github.com/evaera/moonwave) JSON output files.
This project was created due to myself wanting a more customizable way to use Moonwave.

It was initially meant as purely a proof-of-concept, so code quality may not be the best until I eventually rework it.

## Usage
``moonwave_convert extract <folder> [options..]`` - wrapper for the Moonwave extractor. Runs the extractor on your directory and outputs it to the ``--output`` option (or, by default output.json)
``moonwave convert build <folder> <mode> [options..]`` - Extracts data out of ``folder``  with mode ``mode`` (option is currently only ``markdown``) and writes it to ``--output``. 

## Known issues
The extractor turns paths relative to the input directory. For example, a directory containing a folder named "src" has to be extracted from the root directory, as passing ``./src`` into it breaks GitHub file links. So, TLDR: extract the root directory, not subfolders.
