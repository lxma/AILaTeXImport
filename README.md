# AILaTeXImport
Import Adobe Illustrator images into LaTeX

In the past I often used [XFig](http://www.xfig.org) to make simple
drawings and include them in LaTeX documents. I particularly admire
XFig's feature to export _combined PDF and LaTeX_ files.

This project contains
 - An .jsx script that enables Illustrator to do a similar combined PDF/LaTeX export
 - An .sty package to be included in the LaTeX document

Up to now this script has been tested with Illustrator CS4
only. Please give me feedback if you know it does / does not work with
other versions.

# Usage

Prerequisits: Copy aiimport.sty to a place where LaTeX will find
it. You will also need the packages "graphicx" and "xkeyval" installed.

## Exporting from Illustrator
Before you can start exporting you need to ensure following:

 - The text you want to export MUST reside in a seperate Layer named "Text".
 
 - All text items must be single lines of type "pointtext" (not "areatext"
   or "pathtext").
   
 - Beware of the character encoding. Illustrator uses UTF-8. So
   special characters won't work out of the box. If you stick to ASCII
   Symbols you are on the safe side.
 
 - You must to tell Illustrator NOT to use "typographers quotes". Otherwise
   TeX will choke on quote characters (").
   
To perform the combined export, run the script. Choose File->Scripts->Other Script and select the file "Illustrator LaTeX Export.jsx" from the js directory of the repository.

The script generates two files, both with the same base name as the original Illustrator image:

1. A PDF file containing all image data except for the text elements

2. A LaTeX file (with the extension ".tex") containing LaTeX
       instructions to place all text elements and to include the PDF
       file

## Importing into LaTeX

 - Insert \usepackage{aiimport} into the document preamble.
 
 - At the place you want to import the document just use
   \input{<tex-file>}. The TeX file contains LaTeX instructions to
   place the text elements as well as the exported PDF image.

