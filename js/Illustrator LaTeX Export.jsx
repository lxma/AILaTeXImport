/*
** This Script exports Text and Image parts from an Adobe Illustrator
** into two files consumable by LaTeX. It thus generates a function
** similar to the "Combined PDF/LaTeX" export feature of XFig.
**
** - The text you want to export MUST reside in a seperate Layer named "Text".
** - All text items must be single lines of type "pointtext" (not "areatext"
**   or "pathtext").
** - Since Illustrator uses UTF-8 Format you may only use ASCII Symbols (no
**   accented characters). If you use XeLaTeX, this should not be a problem.
** - You must to tell Illustrator NOT to use "typographers quotes". Otherwise
**   TeX will choke on quote characters (").
** - The script generates a file with the same basename as the Illustrator file
**   but with the extension ".tex".
** - You need to save PDF- or EPS-versions of the Illustrator file manually.
**   (You probably want to make the "Text" Layer invisible for that.)
** - As long as the "Text" layer is invisible, its elements are ignored
**   when illustrator calculates the bounding box. So take care the text
**   elements are framed by graphics elements. (E.g. put white spots in the
**   upper left and the lower right corners of your picture - on a
**   visible layer.)
** - In your LaTeX document you need to include one of the packages "graphics"
**   or "graphicx".
** - To include the Picture use the command "\input{name-of-the-picture.tex}"
**   The tex-part takes care of importing the pdf- or eps-parts itself.
**
** See the file "example.tex" for details.
**
** Changes:
**  - Using correct bounding box
*/

AutoSaveAsPDF = true;
AutoSaveAsEPS = false;

function uniq( A ){
    var buf = {}, result = [];
    
    for(var i = 0, l = A.length; i < l; ++i){
        if(!buf.hasOwnProperty(A[i])) {
            result.push(A[i]);
            buf[A[i]] = 1;
        }
    }
    return result;
}


function saveAsPDF( aDocument )
{
    var theDocumentName = aDocument.name;

    var pdfSaveOptions = new PDFSaveOptions();
    pdfSaveOptions.preserveEditability = true;
    pdfSaveOptions.acrobatLayers       = false;
    pdfSaveOptions.compatibility       = PDFCompatibility.ACROBAT4;
    

    var docPath = aDocument.path;
    var docPathStr = docPath.toString();
    if (docPathStr.length > 1)
    {
        var documentPath = aDocument.path + "/" + aDocument.name;               
    }
    else
    {
        // This is a brand new file and doesn't have a path yet,
        // so put it in the illustrator application folder.
        var documentPath = path + "/" + aDocument.name;
    }
    var theFile = new File(documentPath);
    aDocument.saveAs(theFile, pdfSaveOptions);
}

function saveAsEPS( aDocument )
{
    var theDocumentName = aDocument.name;
    
    var epsSaveOptions = new EPSSaveOptions();
    epsSaveOptions.preserveEditability = true;
    var docPath = aDocument.path;
    var docPathStr = docPath.toString();
    if (docPathStr.length > 1)
    {
        var documentPath = aDocument.path + "/" + aDocument.name;               
    }
    else
    {
        // This is a brand new file and doesn't have a path yet,
        // so put it in the illustrator application folder.
        var documentPath = path + "/" + aDocument.name;
    }
    var theFile = new File(documentPath);
    aDocument.saveAs(theFile, epsSaveOptions);
}

function texjust( just )
{
    if( just == Justification.LEFT )
        return "l";
    else if ( just == Justification.RIGHT )
        return "r";
    else
        return "";
}


function basename( filename )
{
    var punktWo = filename.lastIndexOf( "\." );

    if( punktWo > 0 ) {
        return filename.substr( 0, punktWo );
    }
    else {
        alert( "Konnte " + filename + " nicht zu .tex erweitern!" );
        return filename;
    }
}


function rotationOfMatrix( matrix )
{
    // we only use the image of the first column vector (x,y) ...
    var x = matrix.mValueA;
    var y = matrix.mValueB;
    var angle;
    var degreeFactor = 180 / Math.PI;
    
    // even values for right angles
    if( x === 1 && y === 0 ){
        // no rotation
        return { pre: "", post: "" };
    } else if( x === 0 && y === 1 ){
        angle = 90;
    } else if( x === -1 && y === 0 ){
        angle = 180;
    } else if( x === 0 && y === -1 ){
        angle = 270;
    } else {        
        angle = degreeFactor * Math.asin( y / (x*x + y*y) ) ;
        
        if( angle > 0 && x < 0 ){ 
            angle = 180 - angle;
        } else if( angle < 0 && x > 0 ){ 
            angle = 360 + angle;
        } else if( angle < 0 && x < 0 ){ 
            angle = 180 - angle;
        } else { // angle > 0 && x > 0
            // angle = angle;
        }
    }

    return { pre:  "\\AIrotate{" + angle + "}{",
             post: "}" };
}


function extremeCoords( items, bbox )
{
    var links = bbox[0];
    var oben = bbox[1];
    var rechts = bbox[2];
    var unten = bbox[3];

    for( var i = 0; i < items.length; i++ ) {
        var x = items[i].anchor[0];
        var y = items[i].anchor[1];
        if( x < links ) links = x;
        if( x > rechts ) rechts = x;
        if( y < unten ) unten = y;
        if( y > oben ) oben = y;
    }

    return new Array( links, oben, rechts, unten );
}


function rgbColor( color )
{
    if( color.typename === "RGBColor"
        && ( color.red > 0 || color.green > 0 || color.blue > 0 ) ) {
        return "\\AIcolor{" + color.red / 255 + "}{" + color.green / 255 + "}{" + color.blue / 255 + "}";
    } else {
        return "";
    }
}


function mergeMultilines( inputString )
{
    var newline = String.fromCharCode(13); // Illustrator uses ^M
    var strings = inputString.split(newline);
    var result = strings.join("\\\\");

    return result;
}


function main()
{
    // check if a document is open in Illustrator.
    if (app.documents.length <= 0) {
        alert( "No document Open." );
        return;
    }

    // check for layer named "Text"
    try {
        var textLayer = app.activeDocument.layers["Text"];
    }
    catch (error) {
        alert( "Could not find layer named \"Text\" !" );
        return;
    }

    // var items = textLayer.pageItems;
    var items = textLayer.textFrames;
    // check if text layer has elements
    if( items.length == 0 ) {
        alert( "\"Text\" layer is empty  !" );
        return;
    }

    var originalTextLayerVisibleStatus = textLayer.visible;
    var originalSavedStatus = app.activeDocument.saved;
    var originalFilename = app.activeDocument.fullName.fullName;
    textLayer.visible = false;

    /*
    ** Calculate positioning variables:
    **  left,bottom : origin of the LaTeX picture. (I.e.: the point left,bottom in the
    **  Illustrator picture will get the coordinates 0,0 in the LaTeX picture.)
    **  width,height : dimensions of the LaTeX picture.
    **  pdfx,pdfy : position of the imported pdf file in the LaTeX picture
    **  epsx,epsy : position of the imported eps file in the LaTeX picture
    */
    // bounding box of the graphical elements
    var graphical_bbox = app.activeDocument.geometricBounds;
    // bounding box including the graphical and text elements
    var complete_bbox = extremeCoords( items, graphical_bbox );
    var origin = app.activeDocument.rulerOrigin;
    var left = complete_bbox[0];
    var bottom = complete_bbox[3];
    var width = complete_bbox[2] - left;
    var height =  complete_bbox[1] - bottom;
    var pdfx = - left - origin[0];
    var pdfy = - bottom - origin[1];
    
    var texfilename = basename( originalFilename ) + ".tex";
    var tex_output;
    var msg;
    var usedFonts = [];
    
    tex_output = "% LaTeX-Picture Umgebung\n"
        + "% converted from " + app.activeDocument.fullName + "\n"
        + "% named " + texfilename + "\n"
        + "%\n"
        + "\\setlength{\\unitlength}{1bp}% bp (\"big\" point) NOT pt! \n"
        + "\\begin{picture}(" + width + "," + height + ")\n"
        + "% pdftex uses MediaBox instead of ArtBox - so we have to shift the pdffile individually:\n"
        + "\\put(" + pdfx + "," + pdfy + "){%\n"
        + "    \\includegraphics{\\AIprefix " + basename( app.activeDocument.name ) + "\\AIsuffix}}\n"
        + "% cropbox " + app.activeDocument.cropBox + "\n"
        + "% graphical bbox: " + graphical_bbox + "\n"
        + "% complete bbox: " + complete_bbox + "\n"
        + "% my origin: " + origin + "\n"
        + "% page origin: " + app.activeDocument.pageOrigin + "\n"
        + "% ruler origin: " + app.activeDocument.rulerOrigin + "\n";

    var count = 0;
    for ( var i = 0 ; i < items.length ; i++ ) {
        if (items[i].typename == "TextFrame"
            && items[i].kind == TextType.POINTTEXT
            && items[i].contents.length > 0 ) {
            var xpos     = items[i].anchor[0] - left;
            var ypos     = items[i].anchor[1] - bottom;
            var just     = items[i].paragraphs[0].paragraphAttributes.justification;
            var size     = items[i].paragraphs[0].characterAttributes.size;
            var fontName = items[i].paragraphs[0].characterAttributes.textFont.name;
            usedFonts.push( fontName );
            var contents = mergeMultilines( items[i].contents );
            var rotation = rotationOfMatrix( items[i].matrix );
            
            var rgbcolor = rgbColor( items[i].paragraphs[0].characterAttributes.fillColor ); // color is "fill color"
            tex_output += "% Item # " + i + ": '" + contents + "'\n"
                + "\\put(" + xpos + "," + ypos + ")"
                + "{" + rotation.pre
                + "\\makebox(0,0)[" + texjust(just) + "b]{" // choose the base line as output, not the outline
                + "\\raisebox{0pt}[0pt][0pt]{{"
                + "\\AIsetfont{" + fontName + "}"
                + "\\AIfontsize{" + size + "}"
                + rgbcolor
                + contents + "}}}" + rotation.post + "}\n"
                + "\\AIdebugspot{" + xpos + "}{" + ypos + "}\n";
            count++;
        }                       
    }
    tex_output += "\\end{picture}%\n";
    
    try {
        var outFile = new File( texfilename );
        outFile.encoding = "UTF-8"; 
        outFile.open("w");
        if( ! outFile.write(tex_output) )
            alert( "Error Writing file \"" + texfilename + "\" !" );
        outFile.close;
    }
    catch( error ) {
        alert( "Could not write File" );
    }
    
    if( AutoSaveAsEPS ) {
        saveAsEPS( app.activeDocument );
    }
    if( AutoSaveAsPDF ) {
        saveAsPDF( app.activeDocument );
    }           
    
    textLayer.visible = originalTextLayerVisibleStatus;
    if( AutoSaveAsEPS || AutoSaveAsPDF ) {
        app.activeDocument.saveAs( new File( originalFilename ) );
    }
    usedFonts = uniq( usedFonts.sort() );
    alert( "Exported " + count + " text frames to " + texfilename + "\n"
           + "Using Fonts:\n    " + usedFonts.join( "\n    " )  );
}

main();
